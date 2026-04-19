from pydantic import BaseConfig

class Settings(BaseConfig):
    PROJECT_NAME: str = "Attendance System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Simple way to get settings
    class Config:
        case_sensitive = True

settings = Settings()
