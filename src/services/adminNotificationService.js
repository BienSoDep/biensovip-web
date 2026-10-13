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

// Hàng đợi thông báo "biển mới hợp mệnh" (UC49 T22): đang chờ, số người chờ, đã gửi 24 giờ qua, hạn mức hiện hành.
export function useFengShuiQueueStats(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'fengshui-queue'],
    queryFn: () => apiClient.get('/api/admin/notifications/fengshui-queue'),
    enabled,
    refetchInterval: 60_000,
  });
}

const EMAIL_LOGS_KEY = ['admin', 'email-logs'];

export function useAdminEmailLogs({ page = 1, limit = 20, search = '', status = '', channel = '' } = {}) {
  return useQuery({
    queryKey: [...EMAIL_LOGS_KEY, { page, limit, search, status, channel }],
    queryFn: () => apiClient.get('/api/admin/notifications/email-logs', {
      params: {
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        channel: channel || undefined,
      },
    }),
    placeholderData: (prev) => prev,
  });
}

export function useRunNotificationTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type) => apiClient.post(`/api/admin/notifications/run-trigger/${type}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TYPE_SETTINGS_KEY });
      qc.invalidateQueries({ queryKey: EMAIL_LOGS_KEY });
    },
  });
}

export function useRunAllNotificationTriggers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/api/admin/notifications/run-trigger/all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TYPE_SETTINGS_KEY });
      qc.invalidateQueries({ queryKey: EMAIL_LOGS_KEY });
    },
  });
}

export function useNotificationGuardrails() {
  return useQuery({
    queryKey: ['admin', 'notification-guardrails'],
    queryFn: () => apiClient.get('/api/admin/notifications/guardrails'),
    staleTime: 5 * 60_000,
  });
}

