// Adapter duy nhất nói chuyện với gtag.js thật — TrackingService không gọi window.gtag() trực tiếp,
// luôn qua đây. Đổi/thêm provider khác (Meta Pixel...) = thêm file cùng thư mục, không sửa file này
// (Open/Closed — xem docs/features/analytics/00-README-kien-truc-tracking.md §2.2).
export const ga4Provider = {
  name: 'ga4',
  track(eventName, params) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
  },
};
