import axios from 'axios';
import {
  clearStoredActiveRole,
  getRoleFromPath,
  getStoredActiveRole,
  getStoredSessions,
  setLegacyActiveSession,
  setStoredActiveRole,
  setStoredSessions,
} from '../utils/sessionManager';

const resolveRoleContext = () => {
  const roleFromPath = getRoleFromPath(window.location.pathname);
  if (roleFromPath) return roleFromPath;
  return getStoredActiveRole();
};

const removeSessionForRole = (role) => {
  const sessions = getStoredSessions();
  const roleToRemove = role || getStoredActiveRole();

  if (roleToRemove && sessions[roleToRemove]) {
    delete sessions[roleToRemove];
  }

  setStoredSessions(sessions);

  let nextActiveRole = getStoredActiveRole();
  if (!nextActiveRole || !sessions[nextActiveRole]) {
    nextActiveRole = Object.keys(sessions)[0] || null;
  }

  if (nextActiveRole) {
    setStoredActiveRole(nextActiveRole);
    setLegacyActiveSession(sessions[nextActiveRole]);
  } else {
    clearStoredActiveRole();
    setLegacyActiveSession(null);
  }
};

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use(
  (config) => {
    const url = config?.url || '';
    const isAuthRequest = url.includes('/auth/token') || url.includes('/auth/forgot-password');
    if (isAuthRequest) {
      return config;
    }

    const sessions = getStoredSessions();
    const role = resolveRoleContext();
    const fallbackRole = Object.keys(sessions)[0] || null;
    const activeRole = role && sessions[role] ? role : fallbackRole;
    const token = activeRole ? sessions[activeRole]?.token : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      removeSessionForRole(resolveRoleContext());
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
