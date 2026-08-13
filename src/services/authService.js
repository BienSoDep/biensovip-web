import { apiClient } from './apiClient.js';
import { loadAuth, saveAuth } from '../lib/authStore.js';

// ── Register ──
export async function register({ identifierType, identifier, password, fullName }) {
  return apiClient.post('/api/auth/register', { identifierType, identifier, password, fullName });
}

// ── Login ──
export async function login({ identifier, password }) {
  const data = await apiClient.post('/api/auth/login', { identifier, password });
  if (data?.accessToken) {
    saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
  }
  return data;
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

// ── Verify email ──
export async function verifyEmail(token) {
  return apiClient.post('/api/auth/verify-email', { token });
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
