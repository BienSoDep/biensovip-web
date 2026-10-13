import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

function buildQuery({ q, page, perPage, fromDate, toDate }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('page', String(page || 1));
  params.set('perPage', String(perPage || 20));
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  return params.toString();
}

export function useAdminFengShuiHistory(filters) {
  const qs = buildQuery(filters);
  return useQuery({
    queryKey: ['admin-fengshui-history', qs],
    queryFn: () => apiClient.get(`/api/admin/fengshui-analysis-history?${qs}`),
  });
}
