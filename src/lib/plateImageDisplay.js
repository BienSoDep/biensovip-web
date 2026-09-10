// Quyết định dùng chung cho MỌI nơi hiển thị biển số: ảnh sinh tự động (Cloudinary) chỉ hiện khi
// admin đã bật cờ toàn hệ thống (Settings.showGeneratedPlateImages) VÀ biển đó có ảnh thật. Mặc
// định false — ưu tiên PlateVisual (biển chữ render tại chỗ, không phụ thuộc ảnh sinh AI).
export function shouldShowGeneratedImage(settings, images) {
  return Boolean(settings?.showGeneratedPlateImages) && Array.isArray(images) && images.length > 0;
}
