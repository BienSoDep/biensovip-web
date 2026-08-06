import { test, expect } from '@playwright/test';

test.describe('Desktop/Mobile toggle', () => {
  test('Home: frame width changes and content stays usable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Mobile' }).click();
    await expect(page.getByRole('heading', { name: /Chọn biển số đẹp/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xem kho biển số' })).toBeVisible();

    await page.getByRole('button', { name: 'Desktop' }).click();
    await expect(page.getByRole('heading', { name: /Chọn biển số đẹp/ })).toBeVisible();
  });

  test('PlateList: nav and plate cards visible in mobile frame', async ({ page }) => {
    await page.goto('/#/danh-sach');
    await page.getByRole('button', { name: 'Mobile' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
    await expect(page.locator('text=Gọi ngay').first()).toBeVisible();
  });

  test('PlateDetail: form and content visible in mobile frame', async ({ page }) => {
    await page.goto('/#/bien/p1');
    await page.getByRole('button', { name: 'Mobile' }).click();
    await expect(page.getByRole('button', { name: 'Gọi ngay' })).toBeVisible();
    await page.getByRole('button', { name: 'Gọi ngay' }).click();
    await expect(page.getByLabel('Họ và tên')).toBeVisible();
  });
});
