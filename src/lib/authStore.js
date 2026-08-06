// ponytail: simple localStorage read/write for auth state
const AUTH_KEY = 'bsd_auth';

export function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveAuth(user, isAdmin) {
  try {
    if (user || isAdmin) localStorage.setItem(AUTH_KEY, JSON.stringify({ user: user || null, isAdmin: !!isAdmin }));
    else localStorage.removeItem(AUTH_KEY);
  } catch { /* localStorage blocked */ }
}
