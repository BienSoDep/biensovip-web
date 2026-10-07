import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { loadAuth } from '../lib/authStore.js';

// Số biển theo loại biển / tỉnh (tính theo bộ lọc hiện tại, bỏ chính chiều đó).
export function useVpaAdminFacets(params) {
  const qs = toQuery(params);
  return useQuery({
    queryKey: [KEY, 'facets', qs],
    queryFn: () => apiClient.get(`/api/admin/vpa/plates/facets?${qs}`),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// Admin UC49: duyệt giá biển VPA, ẩn/ghim, cài đặt + lần chạy (super-admin), giám sát và điều khiển crawl (T19).
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
    // Có lượt đang chạy thì làm mới dày hơn để thấy tiến độ theo tỉnh.
    refetchInterval: options?.poll ? (q) => (q.state.data?.running?.length ? 4000 : 15000) : false,
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
// "Crawl ngay": source = key ('official'|'published'|'results'); options = { vehicle, province, fresh, resultsFull, dryRun } (tất cả tùy chọn).
export const useRunVpaCrawl = () => useVpaMutation((arg) => {
  const { source, ...options } = typeof arg === 'string' ? { source: arg } : arg;
  return apiClient.post(`/api/admin/vpa/crawl/${source}/run`, options);
});
export const useStopVpaCrawl = () => useVpaMutation((source) => apiClient.post(`/api/admin/vpa/crawl/${source}/stop`));
export const usePauseVpaCrawl = () => useVpaMutation((value) => apiClient.post('/api/admin/vpa/crawl/pause', { value }));
export const useRevertVpaRun = () => useVpaMutation((runId) => apiClient.post(`/api/admin/vpa/crawl/runs/${runId}/revert`));
export const useApplyVpaVanish = () => useVpaMutation((runId) => apiClient.post(`/api/admin/vpa/crawl/runs/${runId}/apply-vanish`));
export const useVpaAlertTest = () => useMutation({ mutationFn: () => apiClient.post('/api/admin/vpa/crawl/alert-test') });

// Lịch sử lượt chạy có lọc + phân trang (super-admin).
export function useVpaRunSearch(params, enabled = true) {
  const qs = toQuery(params);
  return useQuery({
    queryKey: [KEY, 'run-search', qs],
    queryFn: () => apiClient.get(`/api/admin/vpa/crawl/runs/search?${qs}`),
    placeholderData: (prev) => prev,
    retry: false,
    enabled,
  });
}

// Thay đổi tab của một lượt (từ vpa_plate_status_history).
export function useVpaRunChanges(runId, params) {
  const qs = toQuery(params);
  return useQuery({
    queryKey: [KEY, 'run-changes', runId, qs],
    queryFn: () => apiClient.get(`/api/admin/vpa/crawl/runs/${runId}/changes?${qs}`),
    enabled: !!runId,
    placeholderData: (prev) => prev,
  });
}

export function useVpaQuality(enabled = true) {
  return useQuery({
    queryKey: [KEY, 'quality'],
    queryFn: () => apiClient.get('/api/admin/vpa/quality'),
    retry: false,
    enabled,
    staleTime: 30_000,
  });
}

async function downloadCsv(path, fallbackName) {
  const auth = loadAuth();
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}${path}`, {
    headers: auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
  });
  if (!res.ok) throw new Error(`Xuất file thất bại (${res.status})`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fallbackName}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export const exportVpaRunsCsv = (params) => downloadCsv(`/api/admin/vpa/crawl/runs/export?${toQuery(params)}`, 'vpa-luot-chay');
export const exportVpaRunChangesCsv = (runId, params) => downloadCsv(`/api/admin/vpa/crawl/runs/${runId}/changes/export?${toQuery(params)}`, 'vpa-thay-doi-luot');

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

// Kiểm tra & sửa lỗi dữ liệu biển (trùng, hỏng, lệch). Đếm nặng nên chỉ chạy khi panel mở.
export function useVpaIntegrity(enabled) {
  return useQuery({ queryKey: [KEY, 'integrity'], queryFn: () => apiClient.get('/api/admin/vpa/plates/integrity'), enabled, staleTime: 0, retry: false });
}

export function useVpaIntegrityRows(code, page) {
  return useQuery({
    queryKey: [KEY, 'integrity-rows', code, page],
    queryFn: () => apiClient.get(`/api/admin/vpa/plates/integrity/${code}?page=${page}&limit=20`),
    enabled: !!code,
    placeholderData: (prev) => prev,
  });
}

export const useFixVpaIntegrity = () => useVpaMutation(({ code, ids }) => apiClient.post(`/api/admin/vpa/plates/integrity/${code}/fix`, { ids: ids || null }));

export function useVpaIntegrityFixes(enabled) {
  return useQuery({ queryKey: [KEY, 'integrity-fixes'], queryFn: () => apiClient.get('/api/admin/vpa/plates/integrity-fixes'), enabled, retry: false });
}

export const useUndoVpaIntegrity = () => useVpaMutation((fixId) => apiClient.post(`/api/admin/vpa/plates/integrity-fixes/${fixId}/undo`));
