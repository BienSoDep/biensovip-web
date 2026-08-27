// Chèn f_auto,q_auto vào URL Cloudinary — server tự chọn WebP/AVIF theo browser hỗ trợ,
// tự nén chất lượng tối ưu. Không tốn build pipeline riêng, không cần đổi ảnh gốc đã upload.
// URL không phải Cloudinary (VD Unsplash placeholder cũ) giữ nguyên, không áp dụng.
export function optimizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}
