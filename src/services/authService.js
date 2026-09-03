import { apiClient } from './apiClient.js';
import { loadAuth, saveAuth } from '../lib/authStore.js';

// ── Register ──
export async function register({ identifierType, identifier, password, fullName, referralCode }) {
  return apiClient.post('/api/auth/register', { identifierType, identifier, password, fullName, referralCode });
}

// ── Login ──
export async function login({ identifier, password, remember = true }) {
  const data = await apiClient.post('/api/auth/login', { identifier, password });
  if (data?.accessToken) {
    saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }, remember);
  }
  return data;
}

// ── OTP login (passwordless, keeps existing password unchanged) ──
export async function requestLoginOtp(email) {
  return apiClient.post('/api/auth/otp-login/request', { email });
}

export async function verifyLoginOtp(email, code, remember = true) {
  const data = await apiClient.post('/api/auth/otp-login/verify', { email, code });
  if (data?.accessToken) {
    saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }, remember);
  }
  return data;
}

// ── UC25 — gắn CTV cho user đã đăng ký tự do (first-link-wins) ──
export async function linkReferral(referralCode) {
  return apiClient.put('/api/users/referral', { referralCode });
}

// ── Refresh token ──
export async function refreshToken() {
  const auth = loadAuth();
  if (!auth?.refreshToken) return null;
  try {
    const data = await apiClient.post('/api/auth/refresh', { refreshToken: auth.refreshToken });
    if (data?.accessToken) {
      saveAuth({ ...auth, accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
    }
    return data;
  } catch {
    saveAuth(null);
    return null;
  }
}

// ── Logout ──
export async function logout() {
  const auth = loadAuth();
  try { await apiClient.post('/api/auth/logout', { refreshToken: auth?.refreshToken || '' }); } catch { /* ignore */ }
  saveAuth(null);
}

// ── Admin logout ──
export async function adminLogout() {
  try { await apiClient.post('/api/admin/auth/logout'); } catch { /* ignore */ }
  saveAuth(null);
}

// ── Get current user ──
export async function getMe() {
  return apiClient.get('/api/auth/me');
}

// ── Update profile (BirthDate/Gender cần cho tính năng hợp mệnh; Phone để gửi yêu cầu tư vấn;
// preferredVehicle/preferredPurpose để prefill form tra hợp mệnh lần sau) ──
export async function updateProfile({ fullName, birthDate, gender, phone, preferredVehicle, preferredPurpose } = {}) {
  const data = await apiClient.patch('/api/auth/me', { fullName, birthDate, gender, phone, preferredVehicle, preferredPurpose });
  const auth = loadAuth();
  if (auth) saveAuth({ ...auth, user: data });
  return data;
}

// ── Xác minh email tự chủ trong Profile (OTP) ──
export async function requestEmailVerifyOtp() {
  return apiClient.post('/api/auth/email/verify-otp/request');
}

export async function confirmEmailVerifyOtp(code) {
  return apiClient.post('/api/auth/email/verify-otp/confirm', { code });
}

// ── Forgot password ──
export async function requestPasswordResetOtp(email) {
  return apiClient.post('/api/auth/forgot-password/request-otp', { email });
}

export async function verifyPasswordResetOtp(email, code) {
  return apiClient.post('/api/auth/forgot-password/verify-otp', { email, code });
}

export async function resetPassword(token, newPassword) {
  return apiClient.post('/api/auth/forgot-password/reset', { token, newPassword });
}

// ── Change password (in-session, requires current password) ──
export async function changePassword(currentPassword, newPassword) {
  return apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
}

// ── Restore session on app load ──
export async function restoreSession() {
  const auth = loadAuth();
  if (!auth?.accessToken) return null;
  try {
    const user = await getMe();
    return { ...auth, user };
  } catch {
    const refreshed = await refreshToken();
    if (refreshed?.user) return { ...loadAuth(), user: refreshed.user };
    return null;
  }
}

// ── Admin 2FA (TOTP, tùy chọn) ──
export async function setup2fa() {
  return apiClient.post('/api/admin/auth/2fa/setup');
}

export async function enable2fa(code) {
  return apiClient.post('/api/admin/auth/2fa/enable', { code });
}

export async function disable2fa(password) {
  return apiClient.post('/api/admin/auth/2fa/disable', { password });
}

// ── Quên mật khẩu quản trị — link reset gửi về hộp mail khôi phục cố định, không phải email nhập vào ──
export async function requestAdminPasswordReset(email) {
  return apiClient.post('/api/admin/auth/forgot-password', { email });
}

export async function resetAdminPassword(token, newPassword) {
  return apiClient.post('/api/admin/auth/reset-password', { token, newPassword });
}

// ── Admin tự link + xác thực email dự phòng (dùng để nhận link reset mật khẩu) ──
export async function requestRecoveryEmailOtp(recoveryEmail) {
  return apiClient.post('/api/admin/auth/recovery-email/request-otp', { recoveryEmail });
}

export async function verifyRecoveryEmail(recoveryEmail, code) {
  return apiClient.post('/api/admin/auth/recovery-email/verify', { recoveryEmail, code });
}

// ── Restore admin session ──
export async function restoreAdminSession() {
  const auth = loadAuth();
  if (!auth?.accessToken || !auth?.isAdmin) return null;
  try {
    const admin = await apiClient.get('/api/admin/auth/me');
    return { ...auth, user: admin };
  } catch {
    saveAuth(null);
    return null;
  }
}
