from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import pickle
import numpy as np
import cv2
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

from ..core.database import get_db
from ..models.models import AttendanceLog, Student, Embedding, Section, User
from ..api import deps
from ..services.face_recognition import face_service
from ..services.email_service import send_attendance_email, send_attendance_marked_email

router = APIRouter()

@router.post("/recognize")
async def recognize_faces(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    section_id: int = Form(...),
    session_id: str = Form(...),
    db: Session = Depends(get_db),
    current_faculty: User = Depends(deps.get_current_user)
):
    # Read Image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Detect Faces
    faces = face_service.preprocess_image(img)
    response_data = []
    
    # Get all embeddings for this section (Optimization)
    section = db.query(Section).filter(Section.id == section_id).first()
    section_name = section.name if section else f"Section {section_id}"
    faculty_name = current_faculty.username

    students = db.query(Student).filter(Student.section_id == section_id).all()
    known_embeddings = []
    
    for student in students:
        for embed in student.embeddings:
            known_embeddings.append({
                "vector": pickle.loads(embed.embedding_vector),
                "student_id": student.id,
                "name": student.name,
                "roll_number": student.roll_number,
                "email": student.email,
            })
            
    for face in faces:
        bbox = face['box']
        face_img = face['face_img']
        input_embed = face_service.generate_embedding(face_img)

        if input_embed is None:
            response_data.append({
                "bbox": bbox,
                "status": "Unknown",
                "student": None,
                "name": "Unknown",
                "roll_number": None,
                "confidence": 0.0,
            })
            continue
        
        best_match = None
        max_sim = 0
        
        for known in known_embeddings:
            if known["vector"] is None:
                continue
            sim = face_service.compute_similarity(input_embed, known['vector'])
            if sim > max_sim:
                max_sim = sim
                best_match = known
        
        status = "Unknown"
        student_info = None
        display_name = "Unknown"
        display_roll_number = None
        
        if best_match is not None and max_sim > 0.70:
            status = "Identified"
            student_info = {
                "id": best_match['student_id'],
                "name": best_match['name'],
                "roll_number": best_match['roll_number'],
            }
            display_name = best_match['name']
            display_roll_number = best_match['roll_number']
            
            # Log Attendance
            # Check if already logged for this session to avoid duplicates
            existing_log = db.query(AttendanceLog).filter(
                AttendanceLog.session_id == session_id,
                AttendanceLog.student_id == best_match['student_id']
            ).first()
            
            if not existing_log:
                log = AttendanceLog(
                    student_id=best_match['student_id'],
                    session_id=session_id,
                    status="Present",
                    confidence_score=max_sim
                )
                db.add(log)
                db.commit()
                db.refresh(log)

                if best_match.get("email"):
                    background_tasks.add_task(
                        send_attendance_marked_email,
                        best_match["email"],
                        best_match["name"],
                        session_id,
                        log.timestamp,
                        section_name,
                        faculty_name,
                    )

        response_data.append({
            "bbox": bbox,
            "status": status,
            "student": student_info,
            "name": display_name,
            "roll_number": display_roll_number,
            "confidence": float(max_sim)
        })
        
    return {"faces": response_data}

@router.get("/logs/{session_id}")
def get_session_logs(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    logs = db.query(AttendanceLog).filter(AttendanceLog.session_id == session_id).all()
    # Join with Student
    results = []
    for log in logs:
        results.append({
            "student_id": log.student_id,
            "student_name": log.student.name,
            "roll_number": log.student.roll_number,
            "timestamp": log.timestamp,
            "status": log.status,
            "confidence_score": log.confidence_score
        })
    return results

@router.get("/export/{session_id}")
async def export_attendance(
    session_id: str,
    format: str = "csv",  # csv or excel
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Export attendance report as CSV or Excel"""
    import pandas as pd
    from fastapi.responses import StreamingResponse
    import io
    
    # Get attendance logs with student details
    logs = db.query(AttendanceLog).filter(AttendanceLog.session_id == session_id).all()
    
    if not logs:
        raise HTTPException(status_code=404, detail="No attendance records found for this session")
    
    # Prepare data for export
    data = []
    for log in logs:
        data.append({
            "Student ID": log.student_id,
            "Name": log.student.name,
            "Roll Number": log.student.roll_number,
            "Section": log.student.section.name if log.student.section else "N/A",
            "Timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "Status": log.status,
            "Confidence Score": round(log.confidence_score, 4)
        })
    
    df = pd.DataFrame(data)
    
    # Generate file based on format
    if format.lower() == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Attendance')
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=attendance_{session_id}.csv"}
        )

@router.get("/my-logs")
def get_my_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_student)
):
    """Get attendance logs for the logged-in student"""
    # Find student record linked to this user (username = roll_number)
    student = db.query(Student).filter(Student.roll_number == current_user.username).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this user")
        
    logs = db.query(AttendanceLog).filter(AttendanceLog.student_id == student.id).order_by(AttendanceLog.timestamp.desc()).all()
    
    return [
        {
            "session_id": log.session_id,
            "timestamp": log.timestamp,
            "status": log.status,
            "confidence": log.confidence_score
        }
        for log in logs
    ]

@router.post("/session/{session_id}/complete")
def complete_attendance_session(
    session_id: str,
    section_id: int = Form(...),
    db: Session = Depends(get_db),
    current_faculty: User = Depends(deps.get_current_user)
):
    # Get all students for this section
    students = db.query(Student).filter(Student.section_id == section_id).all()
    # Get logs only for students in this section and this session
    section_student_ids = [student.id for student in students]
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.session_id == session_id,
        AttendanceLog.student_id.in_(section_student_ids),
    ).all()

    present_student_ids = {log.student_id for log in logs if log.status == "Present"}
    
    date_str = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")
    
    absent_students = []
    present_students = []
    
    for student in students:
        status = "Present" if student.id in present_student_ids else "Absent"
        if status == "Absent":
            absent_students.append({
                "id": student.id, 
                "name": student.name, 
                "roll_number": student.roll_number, 
                "email": student.email
            })
        else:
            present_students.append({
                "id": student.id, 
                "name": student.name, 
                "roll_number": student.roll_number, 
                "email": student.email
            })
            
        if status == "Absent" and student.email:
            send_attendance_email(student.email, student.name, status, date_str, current_faculty.username)
            
    return {
        "message": "Session completed. Absent student emails dispatched.",
        "absent_students": absent_students,
        "present_students": present_students
    }

