import { apiClient } from './apiClient.js';

// Lưu lịch sử mỗi lần khách luận giải biển số ở trang /luan-bien-so (public, không cần đăng
// nhập). Gọi fire-and-forget — không chặn UI, lỗi mạng không ảnh hưởng trải nghiệm phân tích
// vốn đã tính xong client-side (xem PlateFengShuiAnalyzerTab.jsx handleAnalyze).
export function saveFengShuiAnalysisHistory(payload) {
  return apiClient.post('/api/fengshui/analysis-history', payload).catch(() => { /* ignore — xem comment trên */ });
}
