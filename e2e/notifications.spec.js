import { test, expect } from '@playwright/test';

async function registerAndLogin(page, label) {
  const email = `notif${label}${Date.now()}@example.com`;
  await page.goto('/#/dang-ky');
  await page.getByLabel('Họ và tên').fill('Notif Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill('matkhau123');
  await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
  await page.getByRole('button', { name: 'Đăng ký' }).click();
  await expect(page.getByText('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')).toBeVisible();

  await page.goto('/#/dang-nhap');
  await page.getByLabel('Email hoặc số điện thoại').fill(email);
  await page.getByLabel('Mật khẩu').fill('matkhau123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByText('Đăng nhập thành công')).toBeVisible();
}

test.describe('Notifications page', () => {
  test('logged-in user with no notifications sees empty state', async ({ page }) => {
    await registerAndLogin(page, 'empty');
    await page.goto('/#/thong-bao-moi');
    await expect(page.getByRole('heading', { name: 'Thông báo' })).toBeVisible();
    await expect(page.getByText('Chưa có thông báo nào')).toBeVisible();
    await page.getByRole('button', { name: 'Khám phá kho biển số' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });
});

test.describe('Header notification bell', () => {
  test('bell hidden for guest, visible after login', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByLabel('Thông báo', { exact: true })).toHaveCount(0);

    await registerAndLogin(page, 'bell');
    await page.goto('/#/');
    await expect(page.getByLabel('Thông báo', { exact: true })).toBeVisible();
  });

  test('bell dropdown opens and shows empty state for a fresh user', async ({ page }) => {
    await registerAndLogin(page, 'dropdown');
    await page.goto('/#/');
    await page.getByLabel('Thông báo', { exact: true }).click();
    await expect(page.getByText('Chưa có thông báo nào.')).toBeVisible();
    await page.getByRole('button', { name: 'Xem tất cả' }).click();
    await expect(page.getByRole('heading', { name: 'Thông báo' })).toBeVisible();
  });
});
