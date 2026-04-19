import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<PrivateRoute roles={['admin']} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                    </Route>

                    <Route element={<PrivateRoute roles={['faculty']} />}>
                        <Route path="/faculty" element={<FacultyDashboard />} />
                    </Route>

                    <Route element={<PrivateRoute roles={['student']} />}>
                        <Route path="/student" element={<StudentDashboard />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
