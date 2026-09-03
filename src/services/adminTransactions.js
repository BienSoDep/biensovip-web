import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useAdminTransactions(filter = {}) {
  const { status, plateId, userId, page = 1, limit = 20 } = filter;
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (plateId) params.set('plateId', plateId);
  if (userId) params.set('userId', userId);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return useQuery({
    queryKey: ['admin-transactions', status ?? '', plateId ?? '', userId ?? '', page, limit],
    queryFn: () => apiClient.get(`/api/admin/transactions?${params.toString()}`),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/transactions', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
  });
}

export function useConfirmTransactionPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, proofUrl }) => apiClient.post(`/api/admin/transactions/${id}/confirm-payment`, { proofUrl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-collaborators'] });
    },
  });
}
