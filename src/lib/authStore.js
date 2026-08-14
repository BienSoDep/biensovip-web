const AUTH_KEY = 'bsd_auth';
const REMEMBER_KEY = 'bsd_remember'; // 'local' | 'session' — tracked outside both stores so loadAuth knows where to look

function activeStorage() {
  try {
    return localStorage.getItem(REMEMBER_KEY) === 'session' ? sessionStorage : localStorage;
  } catch { return localStorage; }
}

export function loadAuth() {
  try {
    const raw = activeStorage().getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// remember: true persists across browser restarts via localStorage; false clears on tab close via sessionStorage.
// Omitted on refresh/update calls — reuses whichever store already holds the session so a mid-session
// token refresh doesn't silently escalate a "not remembered" login into a persisted one.
export function saveAuth(auth, remember) {
  try {
    if (!auth) { clearAuth(); return; }
    if (remember === undefined) remember = localStorage.getItem(REMEMBER_KEY) !== 'session';
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    localStorage.setItem(REMEMBER_KEY, remember ? 'local' : 'session');
    const existing = loadAuth() || {};
    other.removeItem(AUTH_KEY);
    store.setItem(AUTH_KEY, JSON.stringify({ ...existing, ...auth }));
  } catch { /* storage blocked */ }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  } catch { /* ignore */ }
}
