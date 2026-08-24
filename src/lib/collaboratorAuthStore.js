// UC28 — lưu phiên đăng nhập CTV tách biệt hoàn toàn khỏi phiên User (authStore.js dùng key
// bsd_auth, 1 slot duy nhất) — 1 trình duyệt có thể vừa đăng nhập User vừa đăng nhập CTV cùng lúc.
const KEY = 'bsv.ctvAuth';

export function loadCollaboratorAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveCollaboratorAuth(auth) {
  try {
    if (!auth) { localStorage.removeItem(KEY); return; }
    localStorage.setItem(KEY, JSON.stringify(auth));
  } catch { /* storage blocked */ }
}
