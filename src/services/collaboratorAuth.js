// P2 — CTV gộp vào User: đăng nhập CTV qua tài khoản User (/api/auth/*), lưu 1 token duy nhất
// ở authStore (bsd_auth). Token user mang claim is_collaborator → dashboard CTV render từ đó.
import { useMutation, useQuery } from '@tanstack/react-query';
import { login, logout, refreshToken, getMe } from './authService.js';
import { useGoogleLogin, useGoogleConfirmLink } from './googleAuth.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export function useCollaboratorLogin() {
  return useMutation({
    mutationFn: ({ email, password }) => login({ identifier: email, password }),
  });
}

export function useCollaboratorLogout() {
  return useMutation({ mutationFn: () => logout() });
}

export function useCollaboratorMe() {
  return useQuery({ queryKey: ['collaborator', 'me'], queryFn: () => getMe(), retry: false });
}

export function useCollaboratorForgotPasswordRequestOtp() {
  return useMutation({ mutationFn: (email) => post(`${BASE_URL}/api/auth/forgot-password/request-otp`, { email }) });
}

export function useCollaboratorForgotPasswordReset() {
  return useMutation({
    mutationFn: verifyAndReset,
  });
}

export async function refreshCollaboratorToken() {
  return refreshToken();
}

// CTV đăng nhập Google — dùng chung endpoint Google của User (trả token user kèm claim collaborator).
export const useCollaboratorGoogleLogin = useGoogleLogin;
export const useCollaboratorGoogleConfirmLink = useGoogleConfirmLink;

async function post(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const parsed = await res.json().catch(() => null);
  if (!res.ok || !parsed?.success) {
    const err = new Error(parsed?.error?.message || 'Có lỗi xảy ra.');
    err.code = parsed?.error?.code;
    throw err;
  }
  return parsed.data;
}

// Reset mật khẩu User: verify OTP → lấy resetToken → reset.
async function verifyAndReset({ email, otpCode, newPassword }) {
  const verified = await post(`${BASE_URL}/api/auth/forgot-password/verify-otp`, { email, code: otpCode });
  const resetToken = verified?.resetToken ?? verified;
  if (!resetToken) throw new Error('Không nhận được token đặt lại mật khẩu.');
  await post(`${BASE_URL}/api/auth/forgot-password/reset`, { token: resetToken, newPassword });
}
