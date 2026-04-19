import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ roles }) => {
    const { user, loading, hasRoleSession, switchRole } = useAuth();
    const requiredRoles = roles || [];
    const matchedRole = requiredRoles.length > 0
        ? requiredRoles.find((role) => hasRoleSession(role))
        : user?.role;

    useEffect(() => {
        if (matchedRole && user?.role !== matchedRole) {
            switchRole(matchedRole);
        }
    }, [matchedRole, user?.role, switchRole]);

    if (loading) return <div>Loading...</div>;
    if (requiredRoles.length > 0 && !matchedRole) return <Navigate to="/login" replace />;
    if (requiredRoles.length > 0 && matchedRole && !user) return <div>Loading...</div>;
    if (!user && requiredRoles.length === 0) return <Navigate to="/login" replace />;

    return <Outlet />;
};

export default PrivateRoute;
