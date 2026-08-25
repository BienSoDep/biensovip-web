import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

function buildQuery({ status, intent, q, page, perPage, fromDate, toDate, assignedTo }) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (intent && intent !== 'all') params.set('intent', intent);
  if (q) params.set('q', q);
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  if (assignedTo && assignedTo !== 'all') params.set('assignedTo', assignedTo);
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

// UC33 — gán/bỏ gán Staff phụ trách lead
export function useAssignContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, staffId }) => apiClient.patch(`/api/admin/contact-requests/${id}/assign`, { staffId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-contacts'] }),
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
