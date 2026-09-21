import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// Kho FAQ chung — nhiều bộ, mỗi bộ gắn 1 category blog. Bài viết chọn (nhiều-nhiều) bộ nào áp dụng
// thay vì gõ tay từng bài. Sửa 1 bộ ảnh hưởng mọi bài đã gắn bộ đó — invalidate luôn blog-post/admin-blog-posts.
export function useFaqSets(category) {
  return useQuery({
    queryKey: ['faq-sets', category ?? 'all'],
    queryFn: () => apiClient.get(`/api/faq-sets${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  });
}

export function useAdminFaqSets() {
  return useQuery({
    queryKey: ['admin-faq-sets'],
    queryFn: () => apiClient.get('/api/admin/faq-sets'),
  });
}

function invalidateFaqSets(qc) {
  qc.invalidateQueries({ queryKey: ['admin-faq-sets'] });
  qc.invalidateQueries({ queryKey: ['faq-sets'] });
  qc.invalidateQueries({ queryKey: ['blog-post'] });
  qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
}

export function useCreateFaqSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/faq-sets', body),
    onSuccess: () => invalidateFaqSets(qc),
  });
}

export function useUpdateFaqSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/faq-sets/${id}`, body),
    onSuccess: () => invalidateFaqSets(qc),
  });
}

export function useDeleteFaqSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/faq-sets/${id}`),
    onSuccess: () => invalidateFaqSets(qc),
  });
}

// Kho HowTo DUY NHẤT toàn site — không chọn, không lọc theo category/bài. Mọi bài blog tự động
// hiển thị giống nhau — sửa ảnh hưởng MỌI bài, invalidate luôn blog-post/admin-blog-posts.
export function useHowToSteps() {
  return useQuery({
    queryKey: ['how-to-steps'],
    queryFn: () => apiClient.get('/api/how-to-steps'),
  });
}

export function useAdminHowToSteps() {
  return useQuery({
    queryKey: ['admin-how-to-steps'],
    queryFn: () => apiClient.get('/api/admin/how-to-steps'),
  });
}

export function useReplaceHowToSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (steps) => apiClient.put('/api/admin/how-to-steps', { steps }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-how-to-steps'] });
      qc.invalidateQueries({ queryKey: ['how-to-steps'] });
      qc.invalidateQueries({ queryKey: ['blog-post'] });
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    },
  });
}
