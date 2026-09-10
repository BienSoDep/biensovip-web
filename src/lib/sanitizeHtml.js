import DOMPurify from 'dompurify';

// Dùng cho MỌI dangerouslySetInnerHTML render HTML admin tự gõ (bài viết, ưu đãi CTV, thông báo…) —
// chặn <script>/onerror/onclick... để tài khoản admin bị chiếm hoặc gõ nhầm không thể chạy JS trên
// trình duyệt khách xem trang public. Cùng profile với Post.jsx (đã dùng từ trước).
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html || '', { USE_PROFILES: { html: true } });
}
