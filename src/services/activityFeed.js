import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// UC38 — feed hoạt động gần đây sinh bởi backend (chỉ có dữ liệu khi bật config ActivityFeed).
export function useActivityFeed(limit = 8) {
  return useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: () => apiClient.get(`/api/activity-feed?limit=${limit}`),
    refetchInterval: 60_000,
  });
}
