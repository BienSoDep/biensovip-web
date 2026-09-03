import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { loadAuth } from '../lib/authStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Nội dung trang ưu đãi CTV — admin chỉnh, mọi người đọc được.
export function useCollaboratorBenefitContent() {
  return useQuery({
    queryKey: ['collaborator-benefit-content'],
    queryFn: () => apiClient.get('/api/collaborators/benefit-content'),
    staleTime: 60_000,
  });
}

// User đăng nhập nâng cấp chính mình thành CTV (tự-activate, không tạo User mới).
export function useBecomeCollaborator() {
  return useMutation({
    mutationFn: ({ bankAccount, bankCode, bankAccountHolder }) =>
      apiClient.post('/api/collaborators/become', { bankAccount, bankCode, bankAccountHolder }),
  });
}

// UC25 §7 — CTV tự cập nhật ngân hàng sau khi đã active.
export function useUpdateBankInfo() {
  return useMutation({
    mutationFn: ({ bankAccount, bankCode, bankAccountHolder }) =>
      apiClient.patch('/api/collaborators/bank-info', { bankAccount, bankCode, bankAccountHolder }),
  });
}

// Dashboard bắt buộc JWT của chính CTV (trước đây public theo path /dashboard/{code} — rò rỉ tên/số
// tiền hoa hồng cho bất kỳ ai đoán được mã, đã bỏ). Gọi thẳng fetch với Bearer token CTV, không qua
// apiClient (dùng slot token admin/user khác — xem gmailLink.js cho pattern tương tự).
export function useCollaboratorDashboard(enabled) {
  return useQuery({
    queryKey: ['collaborator-dashboard'],
    queryFn: async () => {
      const auth = loadAuth();
      const res = await fetch(`${BASE_URL}/api/collaborators/dashboard`, {
        headers: { Authorization: `Bearer ${auth?.accessToken || ''}` },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        const err = new Error(body?.error?.message || 'Có lỗi xảy ra.');
        err.code = body?.error?.code;
        err.status = res.status;
        throw err;
      }
      return body.data;
    },
    enabled: !!enabled,
    retry: false,
  });
}

// UC25 — danh sách khách đã đăng ký dưới mã giới thiệu của CTV (JWT CTV, pattern như dashboard).
export function useCollaboratorCustomers(enabled) {
  return useQuery({
    queryKey: ['collaborator-customers'],
    queryFn: async () => {
      const auth = loadAuth();
      const res = await fetch(`${BASE_URL}/api/collaborators/customers`, {
        headers: { Authorization: `Bearer ${auth?.accessToken || ''}` },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        const err = new Error(body?.error?.message || 'Có lỗi xảy ra.');
        err.code = body?.error?.code;
        err.status = res.status;
        throw err;
      }
      return body.data;
    },
    enabled: !!enabled,
    retry: false,
  });
}
