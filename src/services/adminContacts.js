import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

function buildQuery({ status, intent, page, perPage }) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (intent && intent !== 'all') params.set('intent', intent);
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
    },
  });
}
