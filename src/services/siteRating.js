import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// UC38 — điểm đánh giá trung bình site + số review hiển thị public.
export function useSiteRating() {
  return useQuery({
    queryKey: ['site-rating'],
    queryFn: () => apiClient.get('/api/site-rating'),
    refetchInterval: 60_000,
  });
}
