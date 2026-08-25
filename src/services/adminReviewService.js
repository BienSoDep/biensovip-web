import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['admin', 'reviews'];

export function useAdminReviews(status, page = 1, perPage = 20, plateId, keyword) {
  return useQuery({
    queryKey: [...KEY, status, page, perPage, plateId, keyword],
    queryFn: () => apiClient.get('/api/admin/reviews', { params: { status, page, perPage, plateId, keyword } }),
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

// UC33 — phản hồi công khai cho review (reply rỗng = xóa phản hồi)
export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }) => apiClient.patch(`/api/admin/reviews/${id}/reply`, { reply }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
