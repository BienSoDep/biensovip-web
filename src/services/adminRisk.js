import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// P1.4 — admin panel "Risk Activity Log" + danh sách CTV flagged (§1.4.2). Đòi quyền risk_events:read/review.
export function useRiskEvents(filter = {}) {
  const { severity, status, dimension, q, page = 1, limit = 20 } = filter;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (severity) params.set('severity', severity);
  if (status) params.set('status', status);
  if (dimension) params.set('dimension', dimension);
  if (q) params.set('q', q);
  return useQuery({
    queryKey: ['admin-risk-events', severity ?? '', status ?? '', dimension ?? '', q ?? '', page, limit],
    queryFn: () => apiClient.get(`/api/admin/risk/events?${params.toString()}`),
  });
}

export function useResolveRiskEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => apiClient.post(`/api/admin/risk/events/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-risk-events'] }),
  });
}

// Danh sách CTV có cờ chưa resolve hoặc risk_score ≥ ngưỡng flagged (§1.4.2).
export function useFlaggedCollaborators() {
  return useQuery({
    queryKey: ['admin-flagged-collaborators'],
    queryFn: () => apiClient.get('/api/admin/risk/collaborators/flagged'),
  });
}

export function useResolveCollaboratorFlags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/admin/risk/collaborators/${id}/resolve-flags`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-flagged-collaborators'] });
      qc.invalidateQueries({ queryKey: ['admin-collaborators'] });
    },
  });
}
