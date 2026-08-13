import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('PlateList mobile filter drawer', () => {
  test('hamburger-style filter button opens drawer, apply and clear both close/reset it', async ({ page }) => {
    await page.goto('/#/danh-sach');
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();

    const toggle = page.getByRole('button', { name: /Bộ lọc/ });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const dialog = page.getByRole('dialog', { name: 'Bộ lọc biển số' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Ngu quy', { exact: true }).check();

    await dialog.getByRole('button', { name: 'Xem kết quả' }).click();
    await expect(dialog).not.toBeVisible();
    // filter count badge reflects the applied filter
    await expect(page.getByRole('button', { name: 'Bộ lọc (1)' })).toBeVisible();
  });

  test('Xóa bộ lọc inside the drawer clears filters', async ({ page }) => {
    await page.goto('/#/danh-sach');
    await page.getByRole('button', { name: /Bộ lọc/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Bộ lọc biển số' });
    await dialog.getByLabel('Ngu quy', { exact: true }).check();
    await dialog.getByRole('button', { name: 'Xóa bộ lọc' }).click();
    await expect(dialog.getByLabel('Ngu quy', { exact: true })).not.toBeChecked();
  });

  test('overlay click / X button closes the drawer', async ({ page }) => {
    await page.goto('/#/danh-sach');
    await page.getByRole('button', { name: /Bộ lọc/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Bộ lọc biển số' });
    await expect(dialog).toBeVisible();
    await page.getByLabel('Đóng bộ lọc').click();
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('AdminShell mobile drawer', () => {
  async function loginAdmin(page) {
    await page.goto('/#/admin');
    await page.getByRole('button', { name: 'Dùng tài khoản mẫu (demo)' }).click();
    await page.getByRole('button', { name: 'Đăng nhập quản trị' }).click();
    await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
  }

  test('hamburger opens the admin nav drawer, item click navigates and closes it', async ({ page }) => {
    await loginAdmin(page);
    await page.getByLabel('Mở menu quản trị').click();
    const dialog = page.getByRole('dialog', { name: 'Menu quản trị' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Biển số' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Biển số' })).toBeVisible();
  });

  test('close (X) button closes the drawer without navigating', async ({ page }) => {
    await loginAdmin(page);
    await page.getByLabel('Mở menu quản trị').click();
    const dialog = page.getByRole('dialog', { name: 'Menu quản trị' });
    await expect(dialog).toBeVisible();
    await page.getByLabel('Đóng menu').click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
  });
});
