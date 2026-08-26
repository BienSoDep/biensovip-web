import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// UC35 — global search (Ctrl+K), debounce ở component gọi.
export function useGlobalSearch(keyword) {
  return useQuery({
    queryKey: ['admin-global-search', keyword],
    queryFn: () => apiClient.get(`/api/admin/search?q=${encodeURIComponent(keyword)}&limit=5`),
    enabled: !!keyword?.trim(),
  });
}
