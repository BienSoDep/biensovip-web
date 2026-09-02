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
    mutationFn: ({ id, status, reason, sendEmail }) => apiClient.patch(`/api/admin/customers/${id}/status`, { status, reason, sendEmail }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
    },
  });
}

// UC35 — sửa thông tin cơ bản khách hàng
export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiClient.patch(`/api/admin/customers/${id}`, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
      qc.invalidateQueries({ queryKey: ['admin-customer-detail', id] });
    },
  });
}

// UC35 — xem/force-logout session khách hàng
export function useCustomerSessions(id) {
  return useQuery({
    queryKey: ['admin-customer-sessions', id],
    queryFn: () => apiClient.get(`/api/admin/customers/${id}/sessions`),
    enabled: !!id,
  });
}

export function useRevokeCustomerSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sessionId }) => apiClient.delete(`/api/admin/customers/${id}/sessions/${sessionId}`),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['admin-customer-sessions', id] }),
  });
}
