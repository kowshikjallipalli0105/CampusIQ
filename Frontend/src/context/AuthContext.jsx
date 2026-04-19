import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import {
    clearAllAuthStorage,
    clearStoredActiveRole,
    getStoredActiveRole,
    getStoredSessions,
    setLegacyActiveSession,
    setStoredActiveRole,
    setStoredSessions,
} from '../utils/sessionManager';

const AuthContext = createContext(null);

const getFallbackRole = (sessions, preferredRole = null) => {
    if (preferredRole && sessions[preferredRole]) return preferredRole;
    const roles = Object.keys(sessions);
    return roles.length > 0 ? roles[0] : null;
};

export const AuthProvider = ({ children }) => {
    const [sessions, setSessions] = useState({});
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const applySessionState = (nextSessions, preferredRole = null) => {
        const safeSessions = nextSessions && typeof nextSessions === 'object' ? nextSessions : {};
        const nextRole = getFallbackRole(safeSessions, preferredRole);

        setStoredSessions(safeSessions);
        setSessions(safeSessions);

        if (nextRole) {
            const activeSession = safeSessions[nextRole];
            setStoredActiveRole(nextRole);
            setLegacyActiveSession(activeSession);
            setUser({ username: activeSession.username, role: nextRole });
        } else {
            clearStoredActiveRole();
            setLegacyActiveSession(null);
            setUser(null);
        }

        return nextRole;
    };

    useEffect(() => {
        const storedSessions = getStoredSessions();
        const storedRole = getStoredActiveRole();
        applySessionState(storedSessions, storedRole);
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const normalizedUsername = (username || '').trim();
        const formData = new FormData();
        formData.append('username', normalizedUsername);
        formData.append('password', password);

        try {
            const response = await api.post('/auth/token', formData);
            const { access_token, role, first_login } = response.data;

            const nextSessions = {
                ...sessions,
                [role]: {
                    token: access_token,
                    username: normalizedUsername,
                    role,
                    first_login: Boolean(first_login),
                },
            };

            applySessionState(nextSessions, role);
            return { success: true, first_login: Boolean(first_login), role };
        } catch (error) {
            console.error("Login failed", error);
            return { success: false };
        }
    };

    const logout = (roleToLogout = null) => {
        const targetRole = roleToLogout || user?.role;
        if (!targetRole) {
            clearAllAuthStorage();
            setSessions({});
            setUser(null);
            return null;
        }

        const nextSessions = { ...sessions };
        delete nextSessions[targetRole];

        const preferredRole = user?.role === targetRole ? null : user?.role;
        return applySessionState(nextSessions, preferredRole);
    };

    const logoutAll = () => {
        clearAllAuthStorage();
        setSessions({});
        setUser(null);
    };

    const switchRole = (role) => {
        if (!sessions[role]) return false;
        applySessionState(sessions, role);
        return true;
    };

    const hasRoleSession = (role) => Boolean(sessions[role]);
    const loggedInRoles = Object.keys(sessions);

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                logoutAll,
                switchRole,
                hasRoleSession,
                loggedInRoles,
                sessions,
                loading,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
