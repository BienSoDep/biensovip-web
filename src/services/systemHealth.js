import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// UC35 — badge "mới" cho Contact/Review/Collaborator, polling 30s.
export function useNotificationCounts(sinceIso) {
  return useQuery({
    queryKey: ['admin-notification-counts', sinceIso],
    queryFn: () => apiClient.get(`/api/admin/notifications/counts${sinceIso ? `?since=${encodeURIComponent(sinceIso)}` : ''}`),
    refetchInterval: 30000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => apiClient.get('/api/admin/system-health'),
    refetchInterval: 60000,
  });
}

// Chuông admin — feed tổng hợp mọi thứ mới, đã lọc theo quyền ở server. Cùng nhịp polling 30s với
// useNotificationCounts để badge chuông và badge sidebar không lệch nhau.
export function useAdminNotificationFeed(limit = 20) {
  return useQuery({
    queryKey: ['admin-notification-feed', limit],
    queryFn: () => apiClient.get(`/api/admin/notifications/feed?limit=${limit}`),
    refetchInterval: 30000,
  });
}
