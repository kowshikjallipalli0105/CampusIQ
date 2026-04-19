from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api import auth, users, students, attendance, sections
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.core import config

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title=config.settings.PROJECT_NAME, version="1.0.0")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation Error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
    )

# CORS
origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parents[1] / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
app.include_router(sections.router, prefix="/sections", tags=["sections"])

@app.get("/")
def read_root():
    return {"message": "Attendance System API is running"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
