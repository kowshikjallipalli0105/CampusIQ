export const SESSION_STORAGE_KEY = 'auth_sessions_v1';
export const ACTIVE_ROLE_STORAGE_KEY = 'active_role_v1';

export const ROLE_HOME_PATH = {
  admin: '/admin',
  faculty: '/faculty',
  student: '/student',
};

const LEGACY_KEYS = ['token', 'role', 'username', 'first_login'];

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const decodeTokenPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }
  return payload.exp * 1000 <= Date.now();
};

export const getRoleFromPath = (pathname = '') => {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/faculty')) return 'faculty';
  if (pathname.startsWith('/student')) return 'student';
  return null;
};

export const getStoredSessions = () => {
  const raw = safeParse(localStorage.getItem(SESSION_STORAGE_KEY), {});
  const sessions = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  const validSessions = {};
  for (const [role, session] of Object.entries(sessions)) {
    if (!session || typeof session !== 'object') continue;
    if (!session.token || !session.username) continue;
    if (isTokenExpired(session.token)) continue;

    validSessions[role] = {
      token: session.token,
      username: session.username,
      role,
      first_login: Boolean(session.first_login),
    };
  }

  if (JSON.stringify(validSessions) !== JSON.stringify(sessions)) {
    setStoredSessions(validSessions);
  }

  return validSessions;
};

export const setStoredSessions = (sessions) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions || {}));
};

export const getStoredActiveRole = () => localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);

export const setStoredActiveRole = (role) => {
  if (!role) {
    clearStoredActiveRole();
    return;
  }
  localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
};

export const clearStoredActiveRole = () => {
  localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY);
};

export const setLegacyActiveSession = (session) => {
  if (!session) {
    clearLegacySession();
    return;
  }

  localStorage.setItem('token', session.token);
  localStorage.setItem('role', session.role);
  localStorage.setItem('username', session.username);
  localStorage.setItem('first_login', String(Boolean(session.first_login)));
};

export const clearLegacySession = () => {
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const clearAllAuthStorage = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  clearStoredActiveRole();
  clearLegacySession();
};
