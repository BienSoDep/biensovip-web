// Đăng ký lượt chạy nền (VPA approve-run) để AdminRunWatcher (widget góc màn hình) theo dõi
// dù người dùng đã rời trang / đóng modal. Lưu localStorage để sống qua điều hướng trang.
const STORAGE_KEY = 'vpa_active_approve_runs';
const EXPORT_STORAGE_KEY = 'vpa_active_export_jobs';

const approveListeners = new Set();
const exportListeners = new Set();

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, ids, listeners) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // localStorage có thể bị chặn (private mode)
  }
  listeners.forEach((fn) => fn(ids));
}

// Approve Runs
export function registerApproveRun(runId) {
  if (!runId) return;
  const ids = read(STORAGE_KEY);
  if (!ids.includes(runId)) write(STORAGE_KEY, [...ids, runId], approveListeners);
}

export function unregisterApproveRun(runId) {
  write(STORAGE_KEY, read(STORAGE_KEY).filter((id) => id !== runId), approveListeners);
}

export function getActiveApproveRuns() {
  return read(STORAGE_KEY);
}

export function subscribeApproveRuns(fn) {
  approveListeners.add(fn);
  return () => approveListeners.delete(fn);
}

// Export Jobs
export function registerExportJob(jobId) {
  if (!jobId) return;
  const ids = read(EXPORT_STORAGE_KEY);
  if (!ids.includes(jobId)) write(EXPORT_STORAGE_KEY, [...ids, jobId], exportListeners);
}

export function unregisterExportJob(jobId) {
  write(EXPORT_STORAGE_KEY, read(EXPORT_STORAGE_KEY).filter((id) => id !== jobId), exportListeners);
}

export function getActiveExportJobs() {
  return read(EXPORT_STORAGE_KEY);
}

export function subscribeExportJobs(fn) {
  exportListeners.add(fn);
  return () => exportListeners.delete(fn);
}
