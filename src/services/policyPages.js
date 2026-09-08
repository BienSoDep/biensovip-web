import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// Public — nội dung trang chính sách tĩnh (điều khoản/bảo mật/hướng dẫn sang tên/FAQ), admin sửa qua admin UI.
export function usePolicyPage(slug, enabled = true) {
  return useQuery({
    queryKey: ['policy-page', slug],
    queryFn: () => apiClient.get(`/api/policy-pages/${slug}`),
    enabled: !!slug && enabled,
    staleTime: 60_000,
  });
}

export function useAdminPolicyPages() {
  return useQuery({
    queryKey: ['admin-policy-pages'],
    queryFn: () => apiClient.get('/api/admin/policy-pages'),
  });
}

export function useUpdatePolicyPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, ...body }) => apiClient.put(`/api/admin/policy-pages/${slug}`, body),
    onSuccess: (_data, { slug }) => {
      qc.invalidateQueries({ queryKey: ['admin-policy-pages'] });
      qc.invalidateQueries({ queryKey: ['policy-page', slug] });
    },
  });
}
