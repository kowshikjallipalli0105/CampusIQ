from pathlib import Path
import sys

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.database import Base, engine
from app.models.models import User, Section, Student, Embedding, AttendanceLog

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
