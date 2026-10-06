import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { loadAuth } from '../lib/authStore.js';

// Admin UC49: duyệt giá biển VPA, ẩn/ghim, cài đặt + lần chạy (super-admin), "Crawl ngay".
const KEY = 'admin-vpa';

function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== '' && v != null) q.set(k, v); });
  return q.toString();
}

export function useVpaAdminPlates(params) {
  const qs = toQuery(params);
  return useQuery({
    queryKey: [KEY, 'plates', qs],
    queryFn: () => apiClient.get(`/api/admin/vpa/plates?${qs}`),
    placeholderData: (prev) => prev,
  });
}

// Cài đặt/lần chạy chỉ super-admin — staff nhận 403, trang hiện thông báo thay vì lỗi.
export function useVpaOverview(options) {
  return useQuery({
    queryKey: [KEY, 'overview'],
    queryFn: () => apiClient.get('/api/admin/vpa/overview'),
    retry: false,
    refetchInterval: options?.poll ? 15000 : false,
    enabled: options?.enabled,
  });
}

export function useVpaRuns(limit = 30, enabled = true) {
  return useQuery({
    queryKey: [KEY, 'runs', limit],
    queryFn: () => apiClient.get(`/api/admin/vpa/crawl/runs?limit=${limit}`),
    retry: false,
    enabled,
  });
}

function useVpaMutation(fn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export const useSetVpaPrice = () => useVpaMutation(({ id, price }) => apiClient.patch(`/api/admin/vpa/plates/${id}/price`, { price }));
export const useApproveVpaSuggested = () => useVpaMutation((ids) => apiClient.post('/api/admin/vpa/plates/price/approve-suggested', { ids }));
export const useRejectVpaPrice = () => useVpaMutation((ids) => apiClient.post('/api/admin/vpa/plates/price/reject', { ids }));
export const useApproveVpaGroup = () => useVpaMutation((groupId) => apiClient.post(`/api/admin/vpa/price-groups/${groupId}/approve`));
export const useHideVpaPlate = () => useVpaMutation(({ id, value }) => apiClient.post(`/api/admin/vpa/plates/${id}/hide`, { value }));
export const usePinVpaPlate = () => useVpaMutation(({ id, value }) => apiClient.post(`/api/admin/vpa/plates/${id}/pin`, { value }));
// Công cụ giống trang Biển số: sửa (khóa trường đã sửa), bỏ khóa, thêm tay, sửa hàng loạt.
export const useUpdateVpaPlate = () => useVpaMutation(({ id, body }) => apiClient.patch(`/api/admin/vpa/plates/${id}`, body));
export const useUnlockVpaFields = () => useVpaMutation(({ id, fields }) => apiClient.post(`/api/admin/vpa/plates/${id}/unlock`, { fields }));
export const useCreateVpaPlate = () => useVpaMutation((body) => apiClient.post('/api/admin/vpa/plates', body));
export const useBulkEditVpa = () => useVpaMutation((body) => apiClient.post('/api/admin/vpa/plates/bulk-edit', body));

// Xuất CSV theo bộ lọc hiện tại (có auth header nên không dùng link trực tiếp).
export async function exportVpaCsv(params) {
  const auth = loadAuth();
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/vpa/plates/export?${toQuery(params)}`, {
    headers: auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
  });
  if (!res.ok) throw new Error(`Xuất file thất bại (${res.status})`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `bien-vpa-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const useUpdateVpaSettings = () => useVpaMutation((body) => apiClient.put('/api/admin/vpa/settings', body));
export const useRunVpaCrawl = () => useVpaMutation((source) => apiClient.post(`/api/admin/vpa/crawl/${source}/run`));

// Import Excel dự phòng (super-admin): file .xlsx theo mẫu; trả { totalRows, inserted, updated, tabChanged, errorCount, errors[] }.
export function useImportVpaExcel() {
  return useVpaMutation((file) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.upload('/api/admin/vpa/plates/import', fd);
  });
}

// Tải mẫu có auth header (link trực tiếp không gửi được Authorization).
export async function downloadVpaTemplate() {
  const auth = loadAuth();
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/vpa/plates/import-template`, {
    headers: auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
  });
  if (!res.ok) throw new Error(`Không tải được file mẫu (${res.status})`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mau-import-vpa.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
