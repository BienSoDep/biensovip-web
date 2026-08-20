import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('register validation errors show on empty submit', async ({ page }) => {
    await page.goto('/#/dang-ky');
    await expect(page.getByRole('heading', { name: 'Tạo tài khoản' })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Vui lòng nhập họ tên.')).toBeVisible();
    await expect(page.getByText('Email chưa đúng định dạng.')).toBeVisible();
  });

  test('register succeeds with valid data', async ({ page }) => {
    await page.goto('/#/dang-ky');
    const email = `test${Date.now()}@example.com`;
    await page.getByLabel('Họ và tên').fill('Nguyễn Văn Test');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu').fill('matkhau123');
    await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')).toBeVisible();
  });

  test('login validation errors show on empty submit', async ({ page }) => {
    await page.goto('/#/dang-nhap');
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByText('Vui lòng nhập email hoặc số điện thoại.')).toBeVisible();
  });

  test('forgot password flow shows OTP step', async ({ page }) => {
    await page.goto('/#/quen-mat-khau');
    await expect(page.getByRole('heading', { name: 'Lấy lại mật khẩu' })).toBeVisible();
    await page.getByLabel('Email đã đăng ký').fill('test@example.com');
    await page.getByRole('button', { name: 'Gửi mã OTP' }).click();

    // Real backend: OTP is emailed, so we can only verify the step transition,
    // not complete the full reset (no seeded/known OTP to submit).
    await expect(page.getByRole('heading', { name: 'Nhập mã xác thực' })).toBeVisible();
    await page.getByLabel('Mã xác thực 6 số').fill('000000');
    await page.getByRole('button', { name: 'Xác nhận mã' }).click();
    await expect(page.getByText('Mã xác thực không đúng.')).toBeVisible();
  });
});
