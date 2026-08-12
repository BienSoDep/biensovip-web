import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useAdminStaff() {
  return useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => apiClient.get('/api/admin/staff'),
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.post('/api/admin/staff', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => apiClient.patch(`/api/admin/staff/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-staff'] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-staff'] }),
  });
}
