// UC30 — sau P2, CTV đăng nhập như User (authStore), nên mọi /api/me/gmail/* đều dùng chung apiClient
// (tự gắn Bearer user token + refresh). Bỏ nhánh token CTV riêng (bsv.ctvAuth) đã gộp.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useGmailStatus() {
  return useQuery({ queryKey: ['gmail', 'status'], queryFn: () => apiClient.get('/api/me/gmail/status') });
}

export function useGmailOAuthUrl() {
  return useMutation({ mutationFn: () => apiClient.get('/api/me/gmail/oauth-url') });
}

export function useUnlinkGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete('/api/me/gmail/link'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gmail', 'status'] }),
  });
}

export function useGmailRecipients(q) {
  return useQuery({
    queryKey: ['gmail', 'recipients', q],
    queryFn: () => apiClient.get(`/api/me/gmail/recipients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    enabled: q !== undefined,
  });
}

export function useSendGmail() {
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/me/gmail/send', body),
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
