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

// UC40 §3.7 — biển đang được quan tâm THẬT (PendingContactCount thật, không phải số vanity/ảo UC38).
export function useHotPlates(limit = 5, enabled = true) {
  return useQuery({
    queryKey: ['collaborator-hot-plates', limit],
    queryFn: () => apiClient.get(`/api/collaborators/hot-plates?limit=${limit}`),
    enabled,
  });
}

// Toàn bộ hoa hồng (khác data.recent trong dashboard chỉ 20 dòng) — dùng cho biểu đồ filter khoảng thời gian.
export function useAllCommissions() {
  return useQuery({
    queryKey: ['collaborator-commissions-all'],
    queryFn: () => apiClient.get('/api/collaborators/commissions'),
  });
}

// UC40 §3.2 — Leaderboard tháng, mặc định tháng hiện tại.
export function useLeaderboard(month) {
  return useQuery({
    queryKey: ['collaborator-leaderboard', month || 'current'],
    queryFn: () => apiClient.get(`/api/collaborators/leaderboard${month ? `?month=${month}` : ''}`),
  });
}

export function useSetLeaderboardVisibility() {
  return useMutation({
    mutationFn: (visible) => apiClient.patch('/api/collaborators/leaderboard-visibility', { visible }),
  });
}

// UC40 §3.5 — lịch sử click theo ngày/nguồn.
export function useClickStats(days = 30) {
  return useQuery({
    queryKey: ['collaborator-click-stats', days],
    queryFn: () => apiClient.get(`/api/collaborators/click-stats?days=${days}`),
  });
}

// UC40 §3.3 — biển CTV hay giới thiệu nhất + sinh link theo 1 biển cụ thể.
export function useTopPlates(limit = 5) {
  return useQuery({
    queryKey: ['collaborator-top-plates', limit],
    queryFn: () => apiClient.get(`/api/collaborators/top-plates?limit=${limit}`),
  });
}

export function useCreatePlateLink() {
  return useMutation({
    mutationFn: (plateId) => apiClient.post('/api/collaborators/plate-links', { plateId }),
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

// CTV tự báo giao dịch chốt ngoài platform (Zalo cá nhân) — chờ admin duyệt trước khi tính hoa hồng.
export function useSubmitDealReport() {
  return useMutation({
    mutationFn: ({ plateId, buyerFullName, buyerPhone, dealAmount, note, proofImageUrl }) =>
      apiClient.post('/api/collaborators/deal-reports', { plateId, buyerFullName, buyerPhone, dealAmount, note, proofImageUrl }),
  });
}

// Upload ảnh minh chứng (chuyển khoản/tin nhắn Zalo) đính kèm báo cáo giao dịch.
export function useUploadDealReportProof() {
  return useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return apiClient.upload('/api/collaborators/deal-reports/upload', fd);
    },
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

// Tiến độ khách đã liên hệ dưới mã giới thiệu của CTV: Mới → Đang tư vấn → Đã cọc → Đã bán
// (khác useCollaboratorCustomers ở trên — đó là user đã đăng ký tài khoản, đây là ContactRequest thật).
export function useCollaboratorContacts(enabled) {
  return useQuery({
    queryKey: ['collaborator-contacts'],
    queryFn: async () => {
      const auth = loadAuth();
      const res = await fetch(`${BASE_URL}/api/collaborators/contacts`, {
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

// Mẫu tin nhắn CTV — admin/staff soạn sẵn, CTV copy gửi khách qua Zalo/Facebook/SMS riêng.
export function useCollaboratorMessageTemplates(enabled) {
  return useQuery({
    queryKey: ['collaborator-message-templates'],
    queryFn: async () => {
      const auth = loadAuth();
      const res = await fetch(`${BASE_URL}/api/collaborators/message-templates`, {
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
