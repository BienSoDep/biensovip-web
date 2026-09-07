import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// UC38 — số liệu tổng site public (nếu chưa bật config thì trả số thật).
export function useSiteStats() {
  return useQuery({
    queryKey: ['site-stats'],
    queryFn: () => apiClient.get('/api/site-stats'),
    refetchInterval: 60_000,
  });
}
