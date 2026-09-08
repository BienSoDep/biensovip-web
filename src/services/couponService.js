import { apiClient } from './apiClient.js';

export async function validateCoupon(code) {
  return apiClient.post('/api/coupons/validate', { code });
}
