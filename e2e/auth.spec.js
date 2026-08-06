import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('register validation errors show on empty submit', async ({ page }) => {
    await page.goto('/#/dang-ky');
    await expect(page.getByRole('heading', { name: 'Tạo tài khoản' })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Vui lòng nhập họ tên.')).toBeVisible();
    await expect(page.getByText('Số điện thoại chưa đúng định dạng.')).toBeVisible();
  });

  test('register succeeds with valid data', async ({ page }) => {
    await page.goto('/#/dang-ky');
    await page.getByLabel('Họ và tên').fill('Nguyễn Văn Test');
    await page.getByLabel('Số điện thoại').fill('0905123456');
    await page.getByLabel('Mật khẩu').fill('matkhau123');
    await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Tạo tài khoản thành công')).toBeVisible();
  });

  test('login validation errors show on empty submit', async ({ page }) => {
    await page.goto('/#/dang-nhap');
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByText('Số điện thoại chưa đúng định dạng.')).toBeVisible();
  });

  test('forgot password 3-step flow', async ({ page }) => {
    await page.goto('/#/quen-mat-khau');
    await expect(page.getByRole('heading', { name: 'Lấy lại mật khẩu' })).toBeVisible();
    await page.getByLabel('Số điện thoại đã đăng ký').fill('0905123456');
    await page.getByRole('button', { name: 'Gửi mã OTP' }).click();

    await expect(page.getByRole('heading', { name: 'Nhập mã xác thực' })).toBeVisible();
    await page.getByLabel('Mã xác thực 6 số').fill('123456');
    await page.getByRole('button', { name: 'Xác nhận mã' }).click();

    await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới' })).toBeVisible();
    await page.getByLabel('Mật khẩu mới').fill('newpassword1');
    await page.getByLabel('Xác nhận mật khẩu').fill('newpassword1');
    await page.getByRole('button', { name: 'Hoàn tất' }).click();

    await expect(page.getByText('Đã đặt lại mật khẩu')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  });
});
