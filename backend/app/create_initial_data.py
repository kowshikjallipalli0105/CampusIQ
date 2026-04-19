from pathlib import Path
import sys

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.database import Base, SessionLocal, engine
from app.models.models import AttendanceLog, Embedding, Section, Student, User
from app.core.security import get_password_hash, verify_password

def init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            user = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                first_login=1,
            )
            db.add(user)
            db.commit()
            print("Admin user created with default password")
            return

        updated = False
        try:
            is_default_password = verify_password("admin123", user.hashed_password)
        except Exception:
            is_default_password = False

        if not is_default_password:
            user.hashed_password = get_password_hash("admin123")
            updated = True
        if user.role != "admin":
            user.role = "admin"
            updated = True
        if not bool(user.first_login):
            user.first_login = 1
            updated = True

        if updated:
            db.commit()
            print("Admin user updated. Login with username 'admin' and password 'admin123'.")
        else:
            print("Admin user already exists with default credentials.")
    finally:
        db.close()

if __name__ == "__main__":
    init()
