import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('register validation errors show on empty submit', async ({ page }) => {
    await page.goto('/dang-ky');
    await expect(page.getByRole('heading', { name: 'Tạo tài khoản' })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Vui lòng nhập họ tên.')).toBeVisible();
    await expect(page.getByText('Email chưa đúng định dạng.')).toBeVisible();
  });

  test('register succeeds with valid data', async ({ page }) => {
    await page.goto('/dang-ky');
    const email = `test${Date.now()}@example.com`;
    await page.getByLabel('Họ và tên').fill('Nguyễn Văn Test');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('matkhau123');
    await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('matkhau123');
    await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    // Register auto-logs-in and redirects to /tai-khoan onboarding — no success toast shown.
    await expect(page.getByRole('heading', { name: 'Hoàn thiện hồ sơ của bạn' })).toBeVisible();
  });

  test('login validation errors show on empty submit', async ({ page }) => {
    await page.goto('/dang-nhap');
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByText('Vui lòng nhập email hoặc số điện thoại.')).toBeVisible();
  });

  test('forgot password flow shows OTP step', async ({ page }) => {
    await page.goto('/quen-mat-khau');
    await expect(page.getByRole('heading', { name: 'Lấy lại mật khẩu' })).toBeVisible();
    await page.getByLabel('Email đã đăng ký').fill('test@example.com');
    await page.getByRole('button', { name: 'Gửi mã OTP' }).click();

    // Real backend: OTP is emailed, so we can only verify the step transition,
    // not complete the full reset (no seeded/known OTP to submit).
    await expect(page.getByRole('heading', { name: 'Nhập mã xác thực' })).toBeVisible();
    // OTP is 6 separate digit boxes (aria-label "Chữ số 1".."Chữ số 6"), not one field.
    for (let i = 1; i <= 6; i++) {
      await page.getByLabel(`Chữ số ${i}`).fill('0');
    }
    await page.getByRole('button', { name: 'Xác nhận mã' }).click();
    await expect(page.getByText('Mã xác thực không đúng.')).toBeVisible();
  });
});
