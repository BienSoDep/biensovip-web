import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

function buildQuery({ status, q, page, perPage }) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (q) params.set('q', q);
  params.set('page', String(page || 1));
  params.set('perPage', String(perPage || 20));
  return params.toString();
}

export function useAdminCustomers(filters) {
  const qs = buildQuery(filters);
  return useQuery({
    queryKey: ['admin-customers', qs],
    queryFn: () => apiClient.get(`/api/admin/customers?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useAdminCustomerDetail(id) {
  return useQuery({
    queryKey: ['admin-customer-detail', id],
    queryFn: () => apiClient.get(`/api/admin/customers/${id}/detail`),
    enabled: !!id,
  });
}

export function useUpdateCustomerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/api/admin/customers/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
    },
  });
}
