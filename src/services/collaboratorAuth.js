import { useMutation, useQuery } from '@tanstack/react-query';
import { loadCollaboratorAuth, saveCollaboratorAuth } from '../lib/collaboratorAuthStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const auth = loadCollaboratorAuth();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (auth?.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const err = new Error(body?.error?.message || 'Có lỗi xảy ra.');
    err.code = body?.error?.code;
    err.status = res.status;
    throw err;
  }
  return body.data;
}

export function useCollaboratorLogin() {
  return useMutation({
    mutationFn: ({ email, password }) => request('/api/collaborators/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    onSuccess: (data) => saveCollaboratorAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, collaborator: data.collaborator }),
  });
}

export function useCollaboratorLogout() {
  return useMutation({
    mutationFn: async () => {
      const auth = loadCollaboratorAuth();
      if (auth?.refreshToken) {
        await request('/api/collaborators/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: auth.refreshToken }) }).catch(() => {});
      }
    },
    onSuccess: () => saveCollaboratorAuth(null),
  });
}

export function useCollaboratorMe() {
  const auth = loadCollaboratorAuth();
  return useQuery({
    queryKey: ['collaborator', 'me'],
    queryFn: () => request('/api/collaborators/me'),
    enabled: Boolean(auth?.accessToken),
    retry: false,
  });
}

export function useCollaboratorForgotPasswordRequestOtp() {
  return useMutation({
    mutationFn: (email) => request('/api/collaborators/auth/forgot-password/request-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  });
}

export function useCollaboratorForgotPasswordReset() {
  return useMutation({
    mutationFn: ({ email, otpCode, newPassword }) =>
      request('/api/collaborators/auth/forgot-password/reset', { method: 'POST', body: JSON.stringify({ email, otpCode, newPassword }) }),
  });
}

export async function refreshCollaboratorToken() {
  const auth = loadCollaboratorAuth();
  if (!auth?.refreshToken) return null;
  try {
    const data = await request('/api/collaborators/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: auth.refreshToken }) });
    saveCollaboratorAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, collaborator: data.collaborator });
    return data;
  } catch {
    saveCollaboratorAuth(null);
    return null;
  }
}
