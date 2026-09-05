// Event registry — nguồn sự thật duy nhất cho tên event + shape param GA4. Component chỉ import đúng
// hàm cần dùng ở đây (Interface Segregation), không import TrackingService trực tiếp. Xem đặc tả đầy
// đủ (lý do track, vị trí gọi, câu hỏi kinh doanh) tại docs/features/analytics/01..04-*.md.
import { track } from './TrackingService.js';

// ===== 01 — Hành trình đấu giá hộ (docs/features/analytics/01-hanh-trinh-dau-gia-ho.md) =====

export function trackViewItemList(listName, plates) {
  track('view_item_list', {
    item_list_name: listName,
    items: (plates || []).slice(0, 20).map((p) => ({
      item_id: p.id, item_name: p.plateNumber, price: p.priceOnRequest ? undefined : p.price,
    })),
  });
}

export function trackSelectItem(plate, listName) {
  track('select_item', { item_id: plate.id, item_name: plate.plateNumber, item_list_name: listName });
}

export function trackViewItem(plate) {
  track('view_item', {
    item_id: plate.id, item_name: plate.plateNumber,
    price: plate.priceOnRequest ? undefined : plate.price, item_category: plate.type,
  });
}

export function trackAddToWishlist(plateId) {
  track('add_to_wishlist', { item_id: plateId });
}

export function trackRemoveFromWishlist(plateId) {
  track('remove_from_wishlist', { item_id: plateId });
}

export function trackGenerateLead(plateId, source, price) {
  track('generate_lead', { item_id: plateId, source, value: price });
}

export function trackShare(method, contentType, itemId) {
  track('share', { method, content_type: contentType, item_id: itemId });
}

// ===== 02 — Tìm kiếm & lọc (docs/features/analytics/02-tim-kiem-va-loc.md) =====

// Chỉ những key này mới tính là "lọc thật" — page/perPage/view là điều hướng UI thuần túy, loại trừ
// khỏi tracking để không làm nhiễu dữ liệu filter_apply (xem 02-tim-kiem-va-loc.md mục "Vị trí KHÔNG track").
const REAL_FILTER_KEYS = ['cat', 'city', 'vehicle', 'priceMin', 'priceMax', 'avoidNumbers', 'sort', 'status', 'q'];

export function trackSearch(searchTerm) {
  if (!searchTerm) return;
  track('search', { search_term: searchTerm });
}

export function trackFilterApply(patch, isPreset = false) {
  const filterType = Object.keys(patch).find((k) => REAL_FILTER_KEYS.includes(k));
  if (!filterType) return;
  track('filter_apply', { filter_type: filterType, filter_value: patch[filterType], is_preset: isPreset });
}

export function trackSearchNoResults(searchTerm, activeFilters) {
  track('search_no_results', { search_term: searchTerm, active_filters: JSON.stringify(activeFilters) });
}

export function trackSelectPricePreset(presetLabel) {
  track('select_price_preset', { preset_label: presetLabel });
}

export function trackAvoidNumberToggle(avoidedNumber, action) {
  track('avoid_number_toggle', { avoided_number: avoidedNumber, action });
}

export function trackSaveSearch(filters) {
  track('save_search', { filters: JSON.stringify(filters) });
}

// ===== 03 — Content/blog engagement (docs/features/analytics/03-content-blog-engagement.md) =====

export function trackViewBlogPost(post) {
  track('view_item', { item_id: post.id, item_name: post.title, item_category: 'blog_post', content_category: post.category });
}

export function trackSelectContent(contentType, itemId, sourcePostId, meaningKey) {
  track('select_content', { content_type: contentType, item_id: itemId, source_post_id: sourcePostId, meaning_key: meaningKey });
}

export function trackScrollDepth(percent, postId) {
  track('scroll', { percent_scrolled: percent, item_id: postId });
}

// ===== 04 — Auth & tài khoản (docs/features/analytics/04-auth-va-tai-khoan.md) =====

export function trackSignUp(method, params = {}) {
  track('sign_up', { method, ...params });
}

export function trackSignUpFailed(method, errorType) {
  track('sign_up_failed', { method, error_type: errorType });
}

export function trackLogin(method) {
  track('login', { method });
}

export function trackCompleteProfile(filledBirthdate) {
  track('complete_profile', { filled_birthdate: filledBirthdate, is_onboarding: true });
}

export function trackSkipProfileOnboarding() {
  track('skip_profile_onboarding', {});
}

// become_collaborator KHÔNG dùng chung trackSignUp — đây là user có sẵn tự nâng cấp, không phải
// tài khoản mới (xem docs/features/analytics/04-auth-va-tai-khoan.md mục "Sửa lại giả định sai").
export function trackBecomeCollaborator() {
  track('become_collaborator', {});
}

// ===== 05 — Hợp mệnh phong thủy & tính năng khác (docs/features/analytics/05-fengshui-va-cac-tinh-nang-khac.md) =====

export function trackFengshuiLookup(purpose, vehicle, hasBudget) {
  track('fengshui_lookup', { purpose, vehicle, has_budget: hasBudget });
}

export function trackAddToCompare(plateId) {
  track('add_to_compare', { item_id: plateId });
}

export function trackRemoveFromCompare(plateId) {
  track('remove_from_compare', { item_id: plateId });
}

export function trackSubmitReview(plateId, rating) {
  track('submit_review', { item_id: plateId, rating });
}
