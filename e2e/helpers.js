// Shared E2E helpers — path-based routing (usePathRouter), not hash routing.
// Admin login is unified with regular user login (single form at /dang-nhap):
// backend tries /api/auth/login first, falls back to /api/admin/auth/login on 401.
// There is no separate "/admin" screen or "demo account" button.
import { expect } from '@playwright/test';

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'duydinhadmin@biensovip.com';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'duydinhadmin@8386';

export async function loginAdmin(page) {
  await page.goto('/dang-nhap');
  await page.getByLabel('Email hoặc số điện thoại').fill(ADMIN_EMAIL);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible({ timeout: 10000 });
}

// Register tự động đăng nhập luôn (không cần bước /dang-nhap riêng) và điều hướng sang
// /tai-khoan (trang "Hoàn thiện hồ sơ" onboarding cho user mới) — không hiện toast xác nhận đăng ký.
export async function registerAndLogin(page, label = '') {
  const email = `e2e${label}${Date.now()}@example.com`;
  const password = 'matkhau123';
  await page.goto('/dang-ky');
  await page.getByLabel('Họ và tên').fill('E2E Test User');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill(password);
  await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
  await page.getByRole('button', { name: 'Đăng ký' }).click();
  await expect(page.getByRole('heading', { name: 'Hoàn thiện hồ sơ của bạn' })).toBeVisible();
  return { email, password };
}
