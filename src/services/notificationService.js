import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['me', 'notifications'];

export function useNotifications({ unreadOnly, page, limit, enabled = true, refetchInterval } = {}) {
  return useQuery({
    queryKey: [...KEY, { unreadOnly, page, limit }],
    queryFn: () => apiClient.get('/api/me/notifications', { params: { unreadOnly, page, limit } }),
    placeholderData: (prev) => prev,
    enabled,
    refetchInterval,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/me/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// T10 — CTR tracking: gọi khi user click/mở thông báo.
export function useMarkNotificationClicked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/me/notifications/${id}/click`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

const SETTINGS_KEY = ['me', 'notification-settings'];

// T4/T5/T8 — cài đặt thông báo theo user.
export function useNotificationSettings() {
  return useQuery({ queryKey: SETTINGS_KEY, queryFn: () => apiClient.get('/api/me/notification-settings') });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.patch('/api/me/notification-settings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}
