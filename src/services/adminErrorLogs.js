import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useAdminErrorLogs(filter = {}) {
  const params = new URLSearchParams();
  if (filter.level) params.set('level', filter.level);
  params.set('page', filter.page ?? 1);
  params.set('limit', filter.limit ?? 50);
  const qs = params.toString();
  return useQuery({
    queryKey: ['admin-error-logs', qs],
    queryFn: () => apiClient.get(`/api/admin/error-logs?${qs}`),
  });
}
