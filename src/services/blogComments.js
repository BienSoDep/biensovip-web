import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useBlogComments(postId) {
  return useQuery({
    queryKey: ['blog-comments', postId],
    queryFn: () => apiClient.get(`/api/blog/posts/${postId}/comments`),
    enabled: !!postId,
  });
}

export function useSubmitBlogComment(postId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content) => apiClient.post(`/api/blog/posts/${postId}/comments`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-comments', postId] }),
  });
}
