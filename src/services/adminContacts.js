import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

function buildQuery({ status, intent, q, page, perPage }) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (intent && intent !== 'all') params.set('intent', intent);
  if (q) params.set('q', q);
  params.set('page', String(page || 1));
  params.set('perPage', String(perPage || 20));
  return params.toString();
}

export function useAdminContacts(filters) {
  const qs = buildQuery(filters);
  return useQuery({
    queryKey: ['admin-contacts', qs],
    queryFn: () => apiClient.get(`/api/admin/contact-requests?${qs}`),
  });
}

export function useUpdateContactStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/api/admin/contact-requests/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-contacts'] });
      qc.invalidateQueries({ queryKey: ['admin-contacts-stats'] });
    },
  });
}

// UC11 — đếm theo trạng thái cho tab lọc (1 query thay 4 query perPage=1).
export function useContactStats({ intent, q }) {
  const params = new URLSearchParams();
  if (intent && intent !== 'all') params.set('intent', intent);
  if (q) params.set('q', q);
  const qs = params.toString();
  return useQuery({
    queryKey: ['admin-contacts-stats', intent, q],
    queryFn: () => apiClient.get(`/api/admin/contact-requests/stats${qs ? `?${qs}` : ''}`),
  });
}
