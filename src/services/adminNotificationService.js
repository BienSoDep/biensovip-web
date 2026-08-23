import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['admin', 'notifications'];

export function useAdminBroadcasts({ page = 1, perPage = 20 } = {}) {
  return useQuery({
    queryKey: [...KEY, { page, perPage }],
    queryFn: () => apiClient.get('/api/admin/notifications', { params: { page, perPage } }),
    placeholderData: (prev) => prev,
  });
}

export function useSendBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/notifications/broadcast', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// Estimate số người nhận theo target ("all" | "subscribed") — cho dòng "~N người nhận" trước khi gửi.
export function useNotificationRecipientCount({ target } = {}) {
  return useQuery({
    queryKey: [...KEY, 'recipient-count', { target }],
    queryFn: () => apiClient.get('/api/admin/notifications/recipient-count', { params: { target } }),
    enabled: target === 'all' || target === 'subscribed',
  });
}

const TYPE_SETTINGS_KEY = ['admin', 'notification-type-settings'];

export function useNotificationTypeSettings() {
  return useQuery({
    queryKey: TYPE_SETTINGS_KEY,
    queryFn: () => apiClient.get('/api/admin/notifications/type-settings'),
  });
}

export function useUpdateNotificationTypeSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, ...body }) => apiClient.patch(`/api/admin/notifications/type-settings/${type}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: TYPE_SETTINGS_KEY }),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/notifications/test-email', body),
  });
}

// Preview HTML thật (không gửi email) — admin xem trước real-time khi đang gõ tiêu đề/nội dung.
export function usePreviewEmail() {
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/notifications/preview', body),
  });
}
