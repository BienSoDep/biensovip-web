import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function usePlateReviews(plateId, { page = 1, perPage = 20 } = {}) {
  return useQuery({
    queryKey: ['plates', plateId, 'reviews', { page, perPage }],
    queryFn: () => apiClient.get(`/api/plates/${plateId}/reviews`, { params: { page, perPage } }),
    enabled: !!plateId,
    placeholderData: (prev) => prev,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/reviews', body),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['plates', vars.plateId, 'reviews'] }),
  });
}
