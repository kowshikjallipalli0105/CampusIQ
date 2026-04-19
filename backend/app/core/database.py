from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATABASE_FILE = BACKEND_DIR / "attendance.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_FILE.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
