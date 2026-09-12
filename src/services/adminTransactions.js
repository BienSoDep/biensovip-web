import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { invalidateSales } from './adminContacts.js';

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
    onSettled: () => invalidateSales(qc),
  });
}

export function useConfirmTransactionPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, proofUrl }) => apiClient.post(`/api/admin/transactions/${id}/confirm-payment`, { proofUrl }),
    // Optimistic: badge "Đã xác nhận" đổi ngay khi bấm, không chờ round-trip.
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['admin-transactions'] });
      const snapshots = qc.getQueriesData({ queryKey: ['admin-transactions'] });
      for (const [key, data] of snapshots) {
        if (!data?.items) continue;
        qc.setQueryData(key, { ...data, items: data.items.map((t) => (t.id === id ? { ...t, status: 'payment_confirmed' } : t)) });
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      for (const [key, data] of ctx?.snapshots || []) qc.setQueryData(key, data);
    },
    onSettled: () => {
      invalidateSales(qc);
      qc.invalidateQueries({ queryKey: ['admin-collaborators'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/transactions/${id}`),
    onSettled: () => invalidateSales(qc),
  });
}

// Thùng rác — giao dịch soft-delete, tự xóa cứng sau 30 ngày (TransactionPurgeJob).
export function useDeletedTransactions(filter = {}) {
  const { page = 1, limit = 20 } = filter;
  return useQuery({
    queryKey: ['admin-transactions-deleted', page, limit],
    queryFn: () => apiClient.get(`/api/admin/transactions/deleted?page=${page}&limit=${limit}`),
  });
}

export function useRestoreTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/admin/transactions/${id}/restore`),
    onSettled: () => invalidateSales(qc),
  });
}
