import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

function buildQuery({ status, signal, page, perPage }) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (signal && signal !== 'all') params.set('signal', signal);
  params.set('page', String(page || 1));
  params.set('perPage', String(perPage || 20));
  return params.toString();
}

export function useAdminInterestLeads(filters) {
  const qs = buildQuery(filters);
  return useQuery({
    queryKey: ['admin-interest-leads', qs],
    queryFn: () => apiClient.get(`/api/admin/interest-leads?${qs}`),
  });
}

export function useClaimInterestLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/admin/interest-leads/${id}/claim`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-interest-leads'] }),
  });
}

export function useUnclaimInterestLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/admin/interest-leads/${id}/unclaim`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-interest-leads'] }),
  });
}

export function useMarkInterestLeadContacted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.patch(`/api/admin/interest-leads/${id}/contacted`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-interest-leads'] }),
  });
}
