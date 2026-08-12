import { loadAuth } from '../lib/authStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  const token = loadAuth()?.accessToken;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const body = await res.json().catch(() => null);

  if (!res.ok || (body && body.success === false)) {
    const err = body?.error;
    throw new ApiError(err?.message || `Request failed (${res.status})`, res.status, err?.code);
  }
  return body?.data;
}

async function uploadRequest(path, formData) {
  const token = loadAuth()?.accessToken;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData });
  const body = await res.json().catch(() => null);

  if (!res.ok || (body && body.success === false)) {
    const err = body?.error;
    throw new ApiError(err?.message || `Upload failed (${res.status})`, res.status, err?.code);
  }
  return body?.data;
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: data != null ? JSON.stringify(data) : undefined }),
  put: (path, data) => request(path, { method: 'PUT', body: data != null ? JSON.stringify(data) : undefined }),
  patch: (path, data) => request(path, { method: 'PATCH', body: data != null ? JSON.stringify(data) : undefined }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => uploadRequest(path, formData),
};
