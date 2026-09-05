import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers.js';

test.describe('Notifications page', () => {
  test('logged-in user with no notifications sees empty state', async ({ page }) => {
    await registerAndLogin(page, 'empty');
    await page.goto('/thong-bao-moi');
    await expect(page.getByRole('heading', { name: 'Thông báo' })).toBeVisible();
    await expect(page.getByText('Chưa có thông báo nào')).toBeVisible();
    await page.getByRole('button', { name: 'Khám phá kho biển số' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });
});

test.describe('Header notification bell', () => {
  test('bell hidden for guest, visible after login', async ({ page }) => {
    await page.goto('/');
    // Bell button stays in the DOM for guest (CSS-hidden), not removed — check visibility not count.
    await expect(page.getByLabel('Thông báo', { exact: true })).not.toBeVisible();

    await registerAndLogin(page, 'bell');
    await page.goto('/');
    await expect(page.getByLabel('Thông báo', { exact: true })).toBeVisible();
  });

  test('bell dropdown opens and shows empty state for a fresh user', async ({ page }) => {
    await registerAndLogin(page, 'dropdown');
    await page.goto('/');
    await page.getByLabel('Thông báo', { exact: true }).click();
    await expect(page.getByText('Chưa có thông báo nào.')).toBeVisible();
    await page.getByRole('button', { name: 'Xem tất cả' }).click();
    await expect(page.getByRole('heading', { name: 'Thông báo' })).toBeVisible();
  });
});
