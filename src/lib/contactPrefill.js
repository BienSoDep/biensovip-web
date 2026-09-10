import { updateProfile } from '../services/authService.js';

// Prefill mặc định cho form liên hệ/"Chốt biển này" khi đã đăng nhập — ưu tiên user.phone (field
// riêng, có thể đã tự lưu từ lần gửi liên hệ trước hoặc điền tay ở Profile), fallback identifier
// nếu tài khoản đăng ký/đăng nhập bằng số điện thoại (identifier chính là phone khi đó).
export function prefillFromUser(user) {
  return {
    fullName: user?.fullName || '',
    phone: user?.phone || (user?.identifierType === 'phone' ? user?.identifier || '' : ''),
    email: user?.identifierType === 'email' ? (user?.identifier || '') : (user?.email || ''),
  };
}

// Sau khi gửi yêu cầu liên hệ thành công: nếu đã đăng nhập và user CHƯA có số điện thoại trong
// profile, tự lưu số vừa gõ vào profile luôn — lần sau mở form khác đã có sẵn, không phải gõ lại.
// Best-effort: lỗi (VD trùng SĐT người khác) chỉ bỏ qua, không phá luồng gửi liên hệ đã thành công.
export async function maybeSavePhoneToProfile(user, phone, onUserUpdate) {
  if (!user || user.phone || !phone?.trim()) return;
  try {
    const updated = await updateProfile({ phone: phone.trim() });
    onUserUpdate?.(updated);
  } catch {
    /* best-effort — không báo lỗi cho user vì yêu cầu liên hệ chính đã gửi thành công rồi */
  }
}
