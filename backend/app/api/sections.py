from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.models import Section, User
from ..api import deps
from pydantic import BaseModel

router = APIRouter()

class SectionCreate(BaseModel):
    name: str
    academic_year: str

class SectionUpdate(BaseModel):
    name: str
    academic_year: str

class SectionResponse(BaseModel):
    id: int
    name: str
    academic_year: str

@router.post("/", response_model=SectionResponse)
def create_section(
    section: SectionCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    """Create a new section (Admin only)"""
    # Check if section name already exists
    existing = db.query(Section).filter(Section.name == section.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Section with this name already exists")
    
    db_section = Section(name=section.name, academic_year=section.academic_year)
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return SectionResponse(id=db_section.id, name=db_section.name, academic_year=db_section.academic_year)

@router.get("/", response_model=List[SectionResponse])
def list_sections(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """List all sections"""
    sections = db.query(Section).offset(skip).limit(limit).all()
    return [SectionResponse(id=s.id, name=s.name, academic_year=s.academic_year) for s in sections]

@router.get("/{section_id}", response_model=SectionResponse)
def get_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get section by ID"""
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return SectionResponse(id=section.id, name=section.name, academic_year=section.academic_year)

@router.put("/{section_id}", response_model=SectionResponse)
def update_section(
    section_id: int,
    section_update: SectionUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    """Update section (Admin only)"""
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Check if new name conflicts with existing section
    if section_update.name != section.name:
        existing = db.query(Section).filter(Section.name == section_update.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Section with this name already exists")
    
    section.name = section_update.name
    section.academic_year = section_update.academic_year
    db.commit()
    db.refresh(section)
    return SectionResponse(id=section.id, name=section.name, academic_year=section.academic_year)

@router.delete("/{section_id}")
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    """Delete section (Admin only)"""
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Check if section has students
    if section.students:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete section with {len(section.students)} students. Reassign students first."
        )
    
    db.delete(section)
    db.commit()
    return {"message": "Section deleted successfully"}
