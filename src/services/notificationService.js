import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['me', 'notifications'];

export function useNotifications({ unreadOnly, page, limit, enabled = true } = {}) {
  return useQuery({
    queryKey: [...KEY, { unreadOnly, page, limit }],
    queryFn: () => apiClient.get('/api/me/notifications', { params: { unreadOnly, page, limit } }),
    placeholderData: (prev) => prev,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/me/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
