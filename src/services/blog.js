import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useBlogPosts(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['blog-posts', page, limit],
    queryFn: () => apiClient.get(`/api/blog/posts?page=${page}&limit=${limit}`),
  });
}

export function useBlogPost(slug) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => apiClient.get(`/api/blog/posts/${slug}`),
    enabled: !!slug,
    retry: false,
  });
}

export function useRelatedPosts(slug, limit = 3) {
  return useQuery({
    queryKey: ['blog-post-related', slug, limit],
    queryFn: () => apiClient.get(`/api/blog/posts/${slug}/related?limit=${limit}`),
    enabled: !!slug,
  });
}

export function useRelatedPlates(slug, limit = 4) {
  return useQuery({
    queryKey: ['blog-post-related-plates', slug, limit],
    queryFn: () => apiClient.get(`/api/blog/posts/${slug}/related-plates?limit=${limit}`),
    enabled: !!slug,
  });
}

export function useAdminBlogTags() {
  return useQuery({
    queryKey: ['admin-blog-tags'],
    queryFn: () => apiClient.get('/api/admin/blog/tags'),
  });
}

export function useCreateBlogTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name) => apiClient.post('/api/admin/blog/tags', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blog-tags'] }),
  });
}

export function useAdminBlogPosts(status, q, page = 1, limit = 50) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return useQuery({
    queryKey: ['admin-blog-posts', status ?? 'all', q ?? '', page, limit],
    queryFn: () => apiClient.get(`/api/admin/blog/posts?${params.toString()}`),
  });
}

function invalidateBlog(qc) {
  qc.invalidateQueries({ queryKey: ['blog-posts'] });
  qc.invalidateQueries({ queryKey: ['blog-post'] });
  qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/blog/posts', body),
    onSuccess: () => invalidateBlog(qc),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/blog/posts/${id}`, body),
    onSuccess: () => invalidateBlog(qc),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/blog/posts/${id}`),
    onSuccess: () => invalidateBlog(qc),
  });
}
