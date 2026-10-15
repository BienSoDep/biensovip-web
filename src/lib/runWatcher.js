// Đăng ký lượt chạy nền (VPA approve-run) để AdminRunWatcher (widget góc màn hình) theo dõi
// dù người dùng đã rời trang / đóng modal. Lưu localStorage để sống qua điều hướng trang.
const STORAGE_KEY = 'vpa_active_approve_runs';
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage có thể bị chặn (private mode) — bỏ qua, widget chỉ không sống qua điều hướng.
  }
  listeners.forEach((fn) => fn(ids));
}

export function registerApproveRun(runId) {
  if (!runId) return;
  const ids = read();
  if (!ids.includes(runId)) write([...ids, runId]);
}

export function unregisterApproveRun(runId) {
  write(read().filter((id) => id !== runId));
}

export function getActiveApproveRuns() {
  return read();
}

export function subscribeApproveRuns(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
