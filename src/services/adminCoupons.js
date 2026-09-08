import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => apiClient.get('/api/admin/coupons'),
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/coupons', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/coupons/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}
