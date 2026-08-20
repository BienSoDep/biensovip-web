import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['admin', 'reviews'];

export function useAdminReviews(status, page = 1, perPage = 20) {
  return useQuery({
    queryKey: [...KEY, status, page, perPage],
    queryFn: () => apiClient.get('/api/admin/reviews', { params: { status, page, perPage } }),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/api/admin/reviews/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
