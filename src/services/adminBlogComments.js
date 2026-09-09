import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useAdminBlogComments(status) {
  return useQuery({
    queryKey: ['admin-blog-comments', status],
    queryFn: () => apiClient.get(`/api/admin/blog/comments${status ? `?status=${status}` : ''}`),
  });
}

export function useModerateBlogComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.put(`/api/admin/blog/comments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blog-comments'] }),
  });
}
