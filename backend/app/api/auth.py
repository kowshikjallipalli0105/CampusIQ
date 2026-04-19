from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core import security, config
from app.api import deps
from app.core.database import get_db
from app.models.models import User

router = APIRouter()


class ForgotPasswordRequest(BaseModel):
    username: str
    new_password: str

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username = (form_data.username or "").strip()
    user = db.query(User).filter(User.username == username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "first_login": bool(user.first_login)}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    username = (payload.username or "").strip()
    new_password = payload.new_password or ""

    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = security.get_password_hash(new_password)
    user.first_login = 0
    db.commit()

    return {"message": "Password reset successfully. Please login with your new password."}
