# 🎓  Attendance System

> AI-powered face recognition attendance system with multi-face detection for modern educational institutions

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Material-UI](https://img.shields.io/badge/MUI-7.3.7-007FFF?logo=mui)](https://mui.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

The Attendance System is a modern, AI-powered solution that automates classroom attendance using facial recognition technology. It supports real-time multi-face detection, enabling accurate and contactless attendance marking for educational institutions.

### Key Highlights

- **Real-time Face Recognition**: Detect and recognize multiple students simultaneously
- **Role-Based Access Control**: Admin, Faculty, and Student roles with specific permissions
- **Modern UI/UX**: Professional SaaS-grade interface with responsive design
- **Secure Authentication**: JWT-based authentication with password management
- **Comprehensive Reporting**: Export attendance data in CSV and Excel formats
- **Flexible Enrollment**: Support for both webcam capture and file upload

## ✨ Features

### 👨‍💼 Admin Features

- **User Management**: Create and manage user accounts (Admin, Faculty, Student)
- **Section Management**: Create, edit, and delete academic sections
- **Student Management**: Add students and assign them to sections
- **Face Enrollment**: Enroll student faces via webcam or file upload
- **Dashboard Analytics**: View system statistics and enrollment status

### 👨‍🏫 Faculty Features

- **Attendance Sessions**: Start/stop real-time attendance tracking sessions
- **Live Recognition**: Real-time face detection with bounding boxes
- **Session Monitoring**: Track session duration and detected students
- **Attendance Logs**: View detailed attendance records with confidence scores
- **Report Export**: Download attendance reports in CSV or Excel format

### 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Management**: Mandatory password change on first login
- **Role-Based Authorization**: Endpoint protection based on user roles
- **Password Hashing**: Secure password storage using bcrypt

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19.2.0
- **UI Library**: Material-UI (MUI) 7.3.7
- **Routing**: React Router DOM 7.13.0
- **HTTP Client**: Axios 1.13.4
- **Webcam**: react-webcam 7.2.0
- **Build Tool**: Vite 7.2.4
- **Language**: JavaScript/TypeScript

### Backend

- **Framework**: FastAPI 0.115.6
- **Database**: SQLAlchemy with SQLite
- **Authentication**: python-jose, passlib
- **Face Recognition**: DeepFace, MTCNN, OpenCV
- **Data Processing**: pandas, openpyxl, numpy
- **Server**: Uvicorn

### AI/ML Models

- **Face Detection**: MTCNN (Multi-task Cascaded Convolutional Networks)
- **Face Recognition**: FaceNet (via DeepFace)
- **Similarity Metric**: Cosine Similarity (threshold: 0.70)
- **Embedding Dimension**: 128/512 dimensions

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │
│  │  Login   │  │  Admin   │  │  Faculty Dashboard       │   │
│  │  Page    │  │Dashboard │  │  (Webcam + Recognition)  │   │
│  └──────────┘  └──────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   REST API     │
                    │   (FastAPI)    │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌──────▼──────┐      ┌─────▼──────┐
   │   Auth   │      │Face Service │      │  Database  │
   │ Service  │      │  (DeepFace) │      │  (SQLite)  │
   └──────────┘      └─────────────┘      └────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **pip**: Latest version
- **Git**: For cloning the repository

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/s79-attendance-system.git
cd s79-attendance-system
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python app/init_db.py

# Run migration (if needed)
python migrate_add_first_login.py

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

> ⚠️ **Important**: Change the default password immediately after first login.

## 📖 Usage Guide

### For Administrators

1. **Login** with admin credentials
2. **Create Sections** for organizing students
3. **Add Students** and assign them to sections
4. **Enroll Faces**:
   - Select a student
   - Choose upload or webcam mode
   - Capture/upload 3-5 clear face images
   - Submit enrollment

### For Faculty

1. **Login** with faculty credentials
2. **Start Attendance Session**
3. **Position Camera** to capture student faces
4. **Monitor** real-time detection and recognition
5. **Stop Session** when complete
6. **Download Report** in CSV or Excel format

### For Students

1. **Login** with provided credentials
2. **Change Password** on first login
3. View attendance records (future feature)


## 📁 Project Structure

```
CampusIQ/
├── backend/
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── students.py
│   │   │   ├── sections.py
│   │   │   └── attendance.py
│   │   ├── core/             # Core configurations
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   └── deps.py
│   │   ├── models/           # Database models
│   │   │   └── models.py
│   │   ├── services/         # Business logic
│   │   │   └── face_recognition.py
│   │   ├── init_db.py
│   │   └── main.py
│   ├── requirements.txt
│   └── attendance.db
│
├── frontend/
│   ├── src/
│   │   ├── api/              # API client
│   │   │   └── axios.js
│   │   ├── components/       # React components
│   │   │   ├── common/
│   │   │   │   ├── Loader.jsx
│   │   │   │   └── EmptyState.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── PageHeader.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── context/          # React context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── FacultyDashboard.jsx
│   │   ├── styles/           # Global styles
│   │   │   ├── theme.js
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── PRD                       # Product Requirements Document
└── README.md
```

### Login Page
Modern split-screen design with gradient background and glassmorphism effects.

### Admin Dashboard
- Stats cards showing system metrics
- Enhanced tables with search functionality
- Modern dialogs for CRUD operations
- Webcam enrollment with live preview

### Faculty Dashboard
- Real-time session monitoring
- Live face detection with bounding boxes
- Attendance log with confidence scores
- Export functionality

### Student Dashboard
- View attendance records
- View attendance percentage
- View attendance history

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./attendance.db
```

### CORS Configuration

Update `backend/app/main.py` to configure allowed origins:

```python
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative port
    # Add production URLs
]
```

#OR
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


## 🚢 Deployment

### Backend Deployment

1. Update `SECRET_KEY` in production
2. Switch to PostgreSQL for production database
3. Configure CORS for production domain
4. Use production ASGI server (Gunicorn + Uvicorn)

### Frontend Deployment

```bash
cd frontend
npm run build
```