import { loadAuth, saveAuth, clearAuth } from '../lib/authStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let _refreshPromise = null;

// Lỗi mạng (server down / CORS / offline) từ fetch() ném TypeError "Failed to fetch"
// → bọc thành ApiError tiếng Việt để UI hiện thông báo thân thiện thay vì chuỗi tiếng Anh thô.
async function rawFetch(url, opts) {
  try {
    return await fetch(url, opts);
  } catch {
    throw new ApiError('Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng và thử lại.', 0, 'network');
  }
}

async function tryRefresh() {
  const auth = loadAuth();
  if (!auth?.refreshToken) return null;

  // Prevent concurrent refresh storms — reuse the in-flight promise
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const refreshPath = auth.isAdmin ? '/api/admin/auth/refresh' : '/api/auth/refresh';
      const res = await fetch(`${BASE_URL}${refreshPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) return null;
      const data = body.data;
      saveAuth({ ...auth, accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.admin || data.user });
      return data.accessToken;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

async function request(path, options = {}) {
  const auth = loadAuth();
  const token = auth?.accessToken;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await rawFetch(`${BASE_URL}${path}`, { ...options, headers });
  let body = await res.json().catch(() => null);

  // Auto-refresh on 401 — try once, retry original request
  if (res.status === 401 && token) {
    const newToken = await tryRefresh();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await rawFetch(`${BASE_URL}${path}`, { ...options, headers });
      body = await res.json().catch(() => null);
    } else {
      clearAuth();
      // Báo App.jsx session hết hạn để dọn st.user trong bộ nhớ — clearAuth() chỉ xóa
      // localStorage, không tự sync React state, nếu không sẽ gọi API lặp vô hạn (401 loop).
      window.dispatchEvent(new Event('bsd-session-expired'));
    }
  }

  if (!res.ok || (body && body.success === false)) {
    const err = body?.error;
    throw new ApiError(err?.message || `Có lỗi xảy ra (${res.status}). Vui lòng thử lại.`, res.status, err?.code);
  }
  return body?.data;
}

async function uploadRequest(path, formData) {
  const auth = loadAuth();
  const token = auth?.accessToken;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await rawFetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData });
  const body = await res.json().catch(() => null);

  if (!res.ok || (body && body.success === false)) {
    const err = body?.error;
    throw new ApiError(err?.message || `Không tải tệp được (${res.status}). Vui lòng thử lại.`, res.status, err?.code);
  }
  return body?.data;
}

function withParams(path, params) {
  if (!params) return path;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export const apiClient = {
  get: (path, opts) => request(withParams(path, opts?.params)),
  post: (path, data) => request(path, { method: 'POST', body: data != null ? JSON.stringify(data) : undefined }),
  put: (path, data) => request(path, { method: 'PUT', body: data != null ? JSON.stringify(data) : undefined }),
  patch: (path, data) => request(path, { method: 'PATCH', body: data != null ? JSON.stringify(data) : undefined }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => uploadRequest(path, formData),
};
