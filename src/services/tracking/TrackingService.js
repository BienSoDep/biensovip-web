import { ga4Provider } from './providers/ga4Provider.js';

// Danh sách provider đang active — thêm provider mới ở đây, không sửa hàm track() bên dưới
// (Open/Closed). Mọi provider phải implement { name, track(eventName, params) } — cùng interface
// nên hoán đổi/thêm được mà TrackingService không cần biết chi tiết bên trong (Liskov Substitution).
const providers = [ga4Provider];

// Lớp DUY NHẤT trong toàn bộ codebase được phép biết "tracking thật ra là gì" — component/service khác
// không gọi thẳng window.gtag(), chỉ gọi hàm trong events.js, hàm đó gọi track() ở đây (Single
// Responsibility + Dependency Inversion — xem docs/features/analytics/00-README-kien-truc-tracking.md).
export function track(eventName, params = {}) {
  if (!eventName) return;
  for (const provider of providers) {
    try {
      provider.track(eventName, params);
    } catch {
      // Lỗi 1 provider không được làm vỡ luồng nghiệp vụ chính (VD không được chặn nhấn nút mua hàng).
    }
  }
}
