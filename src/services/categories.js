import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export const CATEGORY_GROUPS = [
  { value: 'plate_type', label: 'Loại biển' },
  { value: 'province', label: 'Tỉnh/thành' },
  { value: 'vehicle_type', label: 'Loại xe' },
  { value: 'price_range', label: 'Khoảng giá' },
  { value: 'blog_category', label: 'Danh mục blog' },
];

export function useCategories(group) {
  return useQuery({
    queryKey: ['categories', group ?? 'all'],
    queryFn: () => apiClient.get(`/api/categories${group ? `?group=${group}` : ''}`),
  });
}

export function useAdminCategories(group) {
  return useQuery({
    queryKey: ['admin-categories', group ?? 'all'],
    queryFn: () => apiClient.get(`/api/admin/categories${group ? `?group=${group}` : ''}`),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/categories', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/categories/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
}

export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds) => apiClient.patch('/api/admin/categories/reorder', { orderedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
}

// UC35 — hoàn tác xóa mềm (undo toast 5s)
export function useRestoreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/admin/categories/${id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
}

export const REGIONS = [
  { value: 'bac', label: 'Bắc' },
  { value: 'trung', label: 'Trung' },
  { value: 'nam', label: 'Nam' },
];

// Market control — bật/tắt hoạt động 1 tỉnh/loại xe
export function useSetCategoryActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => apiClient.patch(`/api/admin/categories/${id}/active`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
}

// Market control — bật/tắt hàng loạt mọi tỉnh trong 1 miền
export function useSetRegionActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ region, isActive }) => apiClient.patch(`/api/admin/categories/region/${region}/active`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
}

