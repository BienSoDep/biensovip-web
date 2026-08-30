import { useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { saveAuth } from '../lib/authStore.js';

export function useGoogleLogin() {
  return useMutation({
    mutationFn: (idToken) => apiClient.post('/api/auth/google', { idToken }),
    onSuccess: (data) => saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }, true),
  });
}

export function useGoogleConfirmLink() {
  return useMutation({
    mutationFn: ({ email, otpCode, idToken }) => apiClient.post('/api/auth/google/confirm-link', { email, otpCode, idToken }),
    onSuccess: (data) => saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }, true),
  });
}
