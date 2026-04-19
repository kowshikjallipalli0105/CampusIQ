from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import numpy as np
import cv2
import pickle

from ..core.database import get_db
from ..models.models import Student, Section, Embedding, User
from ..api import deps
from ..services.face_recognition import face_service # Singleton instance

router = APIRouter()

@router.post("/", response_model=dict)
def create_student(
    name: str = Form(...),
    roll_number: str = Form(...),
    email: str = Form(""),
    section_id: int = Form(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    from ..core.security import get_password_hash

    roll_number = (roll_number or "").strip()
    name = (name or "").strip()
    email = (email or "").strip()

    if not roll_number:
        raise HTTPException(status_code=400, detail="Roll number is required")
    if not name:
        raise HTTPException(status_code=400, detail="Student name is required")
    
    # Check section existence
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found. Please create the section first.")
    
    student = db.query(Student).filter(Student.roll_number == roll_number).first()
    if student:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists")
    
    # Check if user already exists with this roll number
    existing_user = db.query(User).filter(User.username == roll_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User account with this roll number already exists")
    
    # Create student record
    student = Student(name=name, roll_number=roll_number, email=email, section_id=section_id)
    db.add(student)
    
    # Create user account for student
    # Username: roll_number, Password: roll_number (they must change on first login)
    initial_password = roll_number
    hashed_password = get_password_hash(initial_password)
    user = User(username=roll_number, hashed_password=hashed_password, role="student", first_login=1)
    db.add(user)
    
    db.commit()
    
    return {
        "id": student.id,
        "name": student.name,
        "username": roll_number,
        "initial_password": initial_password,
        "message": "Student account created. Share these credentials with the student."
    }


@router.post("/{student_id}/enroll")
async def enroll_face(
    student_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    count = 0
    for file in files:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Detect and Process
        faces = face_service.preprocess_image(img)
        if not faces:
            continue
            
        # Assuming the largest face is the student
        # Sort by area
        faces.sort(key=lambda x: x['box'][2] * x['box'][3], reverse=True)
        primary_face = faces[0]['face_img']
        
        # Generate Embedding
        embedding_vector = face_service.generate_embedding(primary_face)
        
        # Store Embedding
        # Store as binary pickle or bytes
        embed_bytes = pickle.dumps(embedding_vector)
        
        embedding_obj = Embedding(student_id=student.id, embedding_vector=embed_bytes)
        db.add(embedding_obj)
        count += 1
    
    db.commit()
    return {"message": f"Successfully enrolled {count} face images"}

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Delete associated user account if it exists
    user = db.query(User).filter(User.username == student.roll_number).first()
    if user:
        db.delete(user)
        
    # Delete student (cascade will delete embeddings/logs if set up, otherwise manual deletion might be needed depending on models layout)
    db.delete(student)
    db.commit()
    
    return {"message": "Student and associated user account deleted successfully"}

@router.get("/", response_model=List[dict])
def list_students(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    students = db.query(Student).offset(skip).limit(limit).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "roll_number": s.roll_number,
            "email": s.email,
            "section_id": s.section_id,
            "embeddings": [{"id": e.id} for e in s.embeddings]  # Include embeddings for status check
        }
        for s in students
    ]

@router.put("/{student_id}")
def update_student(
    student_id: int,
    name: str = Form(None),
    roll_number: str = Form(None),
    email: str = Form(None),
    section_id: int = Form(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if name is not None:
        student.name = name
    if roll_number is not None:
        # Check if new roll number is already taken
        if student.roll_number != roll_number:
            existing_student = db.query(Student).filter(Student.roll_number == roll_number).first()
            if existing_student:
                raise HTTPException(status_code=400, detail="Student with this roll number already exists")
            
            # Update associated user account if roll number changes
            user = db.query(User).filter(User.username == student.roll_number).first()
            if user:
                user.username = roll_number
                
        student.roll_number = roll_number
    if email is not None:
        student.email = email
    if section_id is not None:
        # Validate section existence
        section = db.query(Section).filter(Section.id == section_id).first()
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        student.section_id = section_id

    db.commit()
    
    return {
        "message": "Student updated successfully",
        "student": {
            "id": student.id,
            "name": student.name,
            "roll_number": student.roll_number,
            "email": student.email,
            "section_id": student.section_id
        }
    }
