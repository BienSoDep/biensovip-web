import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers.js';

// /cong-tac-vien giờ là trang marketing tĩnh — CTV thật qua backend
// POST /api/collaborators/become (yêu cầu đăng nhập + số TK/mã ngân hàng),
// không còn form đăng ký công khai điền tên/SĐT trực tiếp trên trang này.
test.describe('Collaborator landing page', () => {
  test('guest sees login CTA, not a registration form', async ({ page }) => {
    await page.goto('/cong-tac-vien');
    await expect(page.getByRole('heading', { name: 'Trở thành Cộng tác viên' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập để trở thành CTV' })).toBeVisible();
  });

  test('logged-in user without CTV yet sees "Trở thành CTV" CTA', async ({ page }) => {
    await registerAndLogin(page, 'ctv');
    await page.goto('/cong-tac-vien');
    await expect(page.getByRole('button', { name: 'Trở thành CTV' })).toBeVisible();
  });
});
