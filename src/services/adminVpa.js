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

// Kết quả đấu giá đã cào (bảng riêng vpa_auction_results — không chung schema với 4 tab vpa_plates).
export function useVpaAuctionResults(params) {
  const qs = toQuery(params);
  return useQuery({
    queryKey: [KEY, 'auction-results', qs],
    queryFn: () => apiClient.get(`/api/admin/vpa/auction-results?${qs}`),
    placeholderData: (prev) => prev,
  });
}

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

// 4 biểu đồ tab "Danh sách biển VPA" — enabled=false khi khung đang gấp lại (không tải cho tới khi mở ra).
export function useVpaStats(enabled = true) {
  return useQuery({
    queryKey: [KEY, 'stats'],
    queryFn: () => apiClient.get('/api/admin/vpa/stats'),
    enabled,
    staleTime: 60_000,
  });
}

// Trang Phân tích thị trường VPA — { provinceId, plateTypeId } null = toàn thị trường.
export function useVpaMarketAnalysis({ provinceId, plateTypeId } = {}) {
  return useQuery({
    queryKey: [KEY, 'market-analysis', provinceId || '', plateTypeId || ''],
    queryFn: () => apiClient.get('/api/admin/vpa/market-analysis', { params: { provinceId, plateTypeId } }),
    staleTime: 60_000,
  });
}

// Minh bạch nguồn giá gợi ý (bấm vào ô Giá gợi ý trong danh sách Biển VPA). Chỉ tải khi modal mở.
export function useVpaPlatePriceReference(id, enabled) {
  return useQuery({
    queryKey: [KEY, 'price-reference', id],
    queryFn: () => apiClient.get(`/api/admin/vpa/plates/${id}/price-reference`),
    enabled: enabled && !!id,
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
// Duyệt MỌI biển khớp bộ lọc hiện tại (không giới hạn 500 như approve-suggested) — server tự lặp theo lô tới hết.
export const useApproveAllVpaSuggested = () => useVpaMutation((params) => apiClient.post(`/api/admin/vpa/plates/price/approve-all?${toQuery(params)}`));
// Published/Official đi chậm hơn Results — tính lại giá mọi nhóm rồi áp giá gợi ý mới cho biển đã duyệt.
export const useApproveRecomputedVpa = () => useVpaMutation((overrideManual) => apiClient.post(`/api/admin/vpa/plates/price/approve-recomputed?overrideManual=${!!overrideManual}`));

// Tính toán lại giá gợi ý cho mọi nhóm và tự động gán vào biển chưa có giá trên hệ thống.
export const useRecomputeVpaSuggestions = () => useVpaMutation(() => apiClient.post('/api/admin/vpa/plates/price/recompute-suggestions'));

// Bản chạy nền có thanh tiến trình — trả { runId } ngay, không chờ duyệt xong (dùng với useVpaApproveRun để polling).
export const useStartApproveAllVpaSuggested = () => useVpaMutation((params) => apiClient.post(`/api/admin/vpa/plates/price/approve-all/start?${toQuery(params)}`));
export const useStartApproveRecomputedVpa = () => useVpaMutation((overrideManual) => apiClient.post(`/api/admin/vpa/plates/price/approve-recomputed/start?overrideManual=${!!overrideManual}`));

// Polling tiến trình 1 lượt duyệt — tự dừng polling khi status khác "running".
export function useVpaApproveRun(runId, enabled) {
  return useQuery({
    queryKey: [KEY, 'approve-run', runId],
    queryFn: () => apiClient.get(`/api/admin/vpa/plates/price/approve-runs/${runId}`),
    enabled: enabled && !!runId,
    refetchInterval: (q) => (q.state.data?.status === 'running' ? 1000 : false),
  });
}
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
// Hủy hẳn (chờ dọn xong) — dùng khi Dừng xong vẫn còn "đang chạy" (dọn dẹp dở) nên đổi xe/Crawl ngay bị chặn VPA_ALREADY_RUNNING.
export const useForceStopVpaCrawl = () => useVpaMutation((source) => apiClient.post(`/api/admin/vpa/crawl/${source}/force-stop`));
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
