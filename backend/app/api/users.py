from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.models import User
from ..api import deps
from ..core.security import get_password_hash
from pydantic import BaseModel

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(deps.get_current_active_admin)
):
    username = (user.username or "").strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    if not user.password:
        raise HTTPException(status_code=400, detail="Password is required")

    db_user = db.query(User).filter(User.username == username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=username, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserResponse(id=db_user.id, username=db_user.username, role=db_user.role)

@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse(id=u.id, username=u.username, role=u.role) for u in users]

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.username == current_admin.username:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class AdminPasswordReset(BaseModel):
    new_password: str
    force_first_login: bool = True

@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    from ..core.security import verify_password
    
    # Verify old password
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.first_login = 0  # Mark as not first login
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    payload: AdminPasswordReset,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not payload.new_password:
        raise HTTPException(status_code=400, detail="New password is required")

    target_user.hashed_password = get_password_hash(payload.new_password)
    target_user.first_login = 1 if payload.force_first_login else 0
    db.commit()

    return {
        "message": "Password reset successfully",
        "user_id": target_user.id,
        "username": target_user.username,
        "role": target_user.role,
        "first_login": bool(target_user.first_login),
    }
