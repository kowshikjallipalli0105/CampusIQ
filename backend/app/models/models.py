from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from ..core.database import Base

IST = timezone(timedelta(hours=5, minutes=30))

def now_ist():
    return datetime.now(IST)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # admin, faculty, student
    first_login = Column(Integer, default=1)  # SQLite uses 1/0 for boolean
    created_at = Column(DateTime, default=now_ist)

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    academic_year = Column(String)
    
    students = relationship("Student", back_populates="section")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    roll_number = Column(String, unique=True, index=True)
    email = Column(String, nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional link to user account
    enrollment_date = Column(DateTime, default=now_ist)

    section = relationship("Section", back_populates="students")
    embeddings = relationship("Embedding", back_populates="student")
    attendance_logs = relationship("AttendanceLog", back_populates="student")

class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    embedding_vector = Column(LargeBinary) # Storing numpy array as bytes
    created_at = Column(DateTime, default=now_ist)

    student = relationship("Student", back_populates="embeddings")

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    session_id = Column(String, index=True) # ID to group a class session
    timestamp = Column(DateTime, default=now_ist)
    status = Column(String) # Present, Late, etc.
    confidence_score = Column(Float)

    student = relationship("Student", back_populates="attendance_logs")
