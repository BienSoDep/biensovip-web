import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useAdminFengShuiHistoryStats() {
  return useQuery({
    queryKey: ['admin-fengshui-history-stats'],
    queryFn: () => apiClient.get('/api/admin/fengshui-analysis-history/stats'),
  });
}

export function useAdminFengShuiHistoryDetail(id) {
  return useQuery({
    queryKey: ['admin-fengshui-history-detail', id],
    queryFn: () => apiClient.get(`/api/admin/fengshui-analysis-history/${id}`),
    enabled: !!id,
  });
}

export function useMarkFengShuiHistoryFollowedUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, followedUp }) => apiClient.patch(`/api/admin/fengshui-analysis-history/${id}/followed-up`, { followedUp }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-fengshui-history'] });
      qc.invalidateQueries({ queryKey: ['admin-fengshui-history-detail'] });
      qc.invalidateQueries({ queryKey: ['admin-fengshui-history-stats'] });
    },
  });
}
