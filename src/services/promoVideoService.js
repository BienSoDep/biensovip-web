import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const PUBLIC_KEY = ['promo-videos'];
const ADMIN_KEY = ['admin', 'promo-videos'];

export function usePromoVideos() {
  return useQuery({ queryKey: PUBLIC_KEY, queryFn: () => apiClient.get('/api/promo-videos') });
}

export function useAdminPromoVideos(status) {
  return useQuery({
    queryKey: [...ADMIN_KEY, status],
    queryFn: () => apiClient.get('/api/admin/promo-videos', { params: { status } }),
  });
}

function invalidateAll(qc) {
  qc.invalidateQueries({ queryKey: ADMIN_KEY });
  qc.invalidateQueries({ queryKey: PUBLIC_KEY });
}

export function useCreatePromoVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/promo-videos', body),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdatePromoVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiClient.put(`/api/admin/promo-videos/${id}`, body),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeletePromoVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/promo-videos/${id}`),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useReorderPromoVideos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items) => apiClient.patch('/api/admin/promo-videos/reorder', items),
    onSuccess: () => invalidateAll(qc),
  });
}
