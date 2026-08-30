import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useAdminCollaborators(q) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return useQuery({
    queryKey: ['admin-collaborators', q ?? ''],
    queryFn: () => apiClient.get(`/api/admin/collaborators${qs}`),
  });
}

export function useUpdateCollaboratorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, commissionRate, suspendReason }) => apiClient.patch(`/api/admin/collaborators/${id}`, { status, commissionRate, suspendReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-collaborators'] }),
  });
}

export function useMarkCommissionsPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/admin/collaborators/${id}/pay-commissions`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-collaborators'] }),
  });
}

// UC34 — breakdown chi tiết Commission theo CTV
export function useCollaboratorCommissions(collaboratorId, filter = {}) {
  const { status, page = 1, limit = 20 } = filter;
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return useQuery({
    queryKey: ['collaborator-commissions', collaboratorId, status, page, limit],
    queryFn: () => apiClient.get(`/api/admin/collaborators/${collaboratorId}/commissions?${params.toString()}`),
    enabled: !!collaboratorId,
  });
}

export function usePayCommissions(collaboratorId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commissionIds, paidAmount, paidNote }) =>
      apiClient.post(`/api/admin/collaborators/${collaboratorId}/commissions/pay`, { commissionIds, paidAmount, paidNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collaborator-commissions', collaboratorId] });
      qc.invalidateQueries({ queryKey: ['admin-collaborators'] });
    },
  });
}

// Nội dung trang ưu đãi CTV — admin đọc/sửa.
export function useAdminCollaboratorBenefitContent() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-collaborator-benefit-content'],
    queryFn: () => apiClient.get('/api/admin/collaborators/benefit-content'),
  });
  const update = useMutation({
    mutationFn: (body) => apiClient.put('/api/admin/collaborators/benefit-content', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-collaborator-benefit-content'] });
      qc.invalidateQueries({ queryKey: ['collaborator-benefit-content'] });
    },
  });
  return { ...query, update };
}
