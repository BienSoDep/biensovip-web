import { useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { saveAuth } from '../lib/authStore.js';
import { loadCollaboratorAuth, saveCollaboratorAuth } from '../lib/collaboratorAuthStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function rawPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const parsed = await res.json().catch(() => null);
  if (!res.ok || !parsed?.success) {
    const err = new Error(parsed?.error?.message || 'Có lỗi xảy ra.');
    err.code = parsed?.error?.code;
    err.status = res.status;
    throw err;
  }
  return parsed.data;
}

// ── Khách hàng (User) ──

export function useGoogleLogin() {
  return useMutation({
    mutationFn: (idToken) => apiClient.post('/api/auth/google', { idToken }),
    onSuccess: (data) => saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }, true),
  });
}

export function useGoogleConfirmLink() {
  return useMutation({
    mutationFn: ({ email, otpCode, idToken }) => apiClient.post('/api/auth/google/confirm-link', { email, otpCode, idToken }),
    onSuccess: (data) => saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }, true),
  });
}

// ── CTV (Collaborator) — apiClient dùng chung slot auth User, không phù hợp; gọi thẳng fetch. ──

export function useCollaboratorGoogleLogin() {
  return useMutation({
    mutationFn: (idToken) => rawPost('/api/collaborators/auth/google', { idToken }),
    onSuccess: (data) => saveCollaboratorAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, collaborator: data.collaborator }),
  });
}

export function useCollaboratorGoogleConfirmLink() {
  return useMutation({
    mutationFn: ({ email, otpCode, idToken }) => rawPost('/api/collaborators/auth/google/confirm-link', { email, otpCode, idToken }),
    onSuccess: (data) => saveCollaboratorAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, collaborator: data.collaborator }),
  });
}

export { loadCollaboratorAuth };
