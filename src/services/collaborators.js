import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { loadCollaboratorAuth } from '../lib/collaboratorAuthStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export function useRegisterCollaborator() {
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/collaborators/register', body),
  });
}

// Dashboard bắt buộc JWT của chính CTV (trước đây public theo path /dashboard/{code} — rò rỉ tên/số
// tiền hoa hồng cho bất kỳ ai đoán được mã, đã bỏ). Gọi thẳng fetch với Bearer token CTV, không qua
// apiClient (dùng slot token admin/user khác — xem gmailLink.js cho pattern tương tự).
export function useCollaboratorDashboard(enabled) {
  return useQuery({
    queryKey: ['collaborator-dashboard'],
    queryFn: async () => {
      const auth = loadCollaboratorAuth();
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
