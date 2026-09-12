import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// 1 nguồn duy nhất cho toàn bộ cache trang Bán hàng. Liên hệ và giao dịch liên kết 2 chiều
// (contact.transactionId, transaction.contactRequestId) nên đổi 1 bên là bên kia đổi theo —
// trước đây useUpdateContactStatus chỉ invalidate ['admin-contacts'] nên kéo thẻ Kanban xong
// bảng Giao dịch vẫn hiện dữ liệu cũ cho tới khi F5, đúng lỗi "phải reload" user báo.
// invalidation của react-query khớp theo prefix nên invalidate key cha là phủ hết mọi biến thể filter.
const SALES_KEYS = [
  ['admin-contacts'],
  ['admin-contacts-stats'],
  ['admin-contacts-deleted'],
  ['admin-transactions'],
  ['admin-transactions-deleted'],
];
export function invalidateSales(qc) {
  for (const queryKey of SALES_KEYS) qc.invalidateQueries({ queryKey });
}

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
    // Optimistic: kéo thẻ Kanban / đổi Select là cột và badge đổi ngay trong ~1 frame, không chờ
    // server. Trước đây phải chờ response mới thấy thẻ nhảy cột — mạng chậm là giật rõ.
    // Rollback về snapshot cũ nếu API lỗi, nên không bao giờ hiển thị trạng thái sai lâu dài.
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['admin-contacts'] });
      const snapshots = qc.getQueriesData({ queryKey: ['admin-contacts'] });
      for (const [key, data] of snapshots) {
        if (!data?.items) continue;
        qc.setQueryData(key, { ...data, items: data.items.map((c) => (c.id === id ? { ...c, status } : c)) });
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      for (const [key, data] of ctx?.snapshots || []) qc.setQueryData(key, data);
    },
    onSettled: () => invalidateSales(qc),
  });
}

// UC33 — gán/bỏ gán Staff phụ trách lead
export function useAssignContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, staffId }) => apiClient.patch(`/api/admin/contact-requests/${id}/assign`, { staffId }),
    onSettled: () => invalidateSales(qc),
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

// Thùng rác — liên hệ soft-delete, tự xóa cứng sau 30 ngày (ContactPurgeJob). Xóa liên hệ kéo theo
// giao dịch còn Pending của nó vào thùng rác, nên invalidate cả cache giao dịch.
export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/contact-requests/${id}`),
    onSettled: () => invalidateSales(qc),
  });
}

export function useDeletedContacts(filter = {}) {
  const { page = 1, limit = 20 } = filter;
  return useQuery({
    queryKey: ['admin-contacts-deleted', page, limit],
    queryFn: () => apiClient.get(`/api/admin/contact-requests/deleted?page=${page}&limit=${limit}`),
  });
}

export function useRestoreContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/admin/contact-requests/${id}/restore`),
    onSettled: () => invalidateSales(qc),
  });
}
