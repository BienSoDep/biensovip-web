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
