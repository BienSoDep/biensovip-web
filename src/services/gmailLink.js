import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { loadCollaboratorAuth } from '../lib/collaboratorAuthStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// UC30 — CTV dùng token riêng (bsv.ctvAuth), admin/staff dùng token của apiClient (bsd_auth). Gọi thẳng
// fetch với đúng Bearer token theo ngữ cảnh gọi, tránh lẫn 2 slot auth khác nhau.
async function request(path, options = {}) {
  const ctvAuth = loadCollaboratorAuth();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (ctvAuth?.accessToken) headers.Authorization = `Bearer ${ctvAuth.accessToken}`;

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

// method(path, opts) dùng cho CTV (không có slot trong apiClient); admin/staff dùng apiClient sẵn có
// (tự gắn Bearer + tự refresh token khi hết hạn).
function pick(ctvFn, adminFn) {
  return (...args) => (loadCollaboratorAuth()?.accessToken ? ctvFn(...args) : adminFn(...args));
}

export function useGmailStatus() {
  return useQuery({
    queryKey: ['gmail', 'status'],
    queryFn: pick(() => request('/api/me/gmail/status'), () => apiClient.get('/api/me/gmail/status')),
  });
}

export function useGmailOAuthUrl() {
  return useMutation({
    mutationFn: pick(() => request('/api/me/gmail/oauth-url'), () => apiClient.get('/api/me/gmail/oauth-url')),
  });
}

export function useUnlinkGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pick(() => request('/api/me/gmail/link', { method: 'DELETE' }), () => apiClient.delete('/api/me/gmail/link')),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gmail', 'status'] }),
  });
}

export function useGmailRecipients(q) {
  return useQuery({
    queryKey: ['gmail', 'recipients', q],
    queryFn: pick(
      () => request(`/api/me/gmail/recipients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
      () => apiClient.get('/api/me/gmail/recipients', { params: { q } }),
    ),
    enabled: q !== undefined,
  });
}

export function useSendGmail() {
  return useMutation({
    mutationFn: pick(
      (body) => request('/api/me/gmail/send', { method: 'POST', body: JSON.stringify(body) }),
      (body) => apiClient.post('/api/me/gmail/send', body),
    ),
  });
}

export function useUpdateCollaboratorEmailLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dailyLimit }) => apiClient.patch(`/api/admin/collaborators/${id}/email-limit`, { dailyLimit }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'collaborators'] }),
  });
}

export function useAdminEmailLog(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v != null && v !== ''));
  return useQuery({
    queryKey: ['admin', 'email-log', filters],
    queryFn: () => apiClient.get(`/api/admin/email-log?${params.toString()}`),
  });
}
