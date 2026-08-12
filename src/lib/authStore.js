const AUTH_KEY = 'bsd_auth';

export function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveAuth(auth) {
  try {
    if (!auth) { localStorage.removeItem(AUTH_KEY); return; }
    const existing = loadAuth() || {};
    localStorage.setItem(AUTH_KEY, JSON.stringify({ ...existing, ...auth }));
  } catch { /* localStorage blocked */ }
}

export function clearAuth() {
  try { localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
}
