import { test, expect } from '@playwright/test';

test.describe('Compare', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.removeItem('biensovip_compare'));
  });

  test('empty state shows CTA to list', async ({ page }) => {
    await page.goto('/#/so-sanh');
    await expect(page.getByRole('heading', { name: 'Chưa có biển để so sánh' })).toBeVisible();
    await page.getByRole('button', { name: 'Xem danh sách biển' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });

  test('adding one plate shows "need one more" state', async ({ page }) => {
    await page.goto('/#/danh-sach');
    await page.getByLabel('Thêm vào so sánh').first().click();
    await page.goto('/#/so-sanh');
    await expect(page.getByRole('heading', { name: 'Cần thêm 1 biển nữa' })).toBeVisible();
  });

  test('adding two plates renders comparison table, remove works', async ({ page }) => {
    await page.goto('/#/danh-sach');
    const compareBtns = page.getByLabel('Thêm vào so sánh');
    await compareBtns.nth(0).click();
    await compareBtns.nth(0).click();
    await page.goto('/#/so-sanh');
    await expect(page.getByText('Thuộc tính')).toBeVisible();
    await expect(page.getByText('Loại biển')).toBeVisible();
    await expect(page.getByText('Giá')).toBeVisible();

    const removeBtns = page.getByLabel('Bỏ khỏi so sánh');
    await expect(removeBtns).toHaveCount(2);
    await removeBtns.first().click();
    // dropping to 1 plate should show the "need one more" empty state
    await expect(page.getByRole('heading', { name: 'Cần thêm 1 biển nữa' })).toBeVisible();
  });

  test('Xóa tất cả clears compare list', async ({ page }) => {
    await page.goto('/#/danh-sach');
    const compareBtns = page.getByLabel('Thêm vào so sánh');
    await compareBtns.nth(0).click();
    await compareBtns.nth(0).click();
    await page.goto('/#/so-sanh');
    await page.getByRole('button', { name: 'Xóa tất cả' }).click();
    await expect(page.getByRole('heading', { name: 'Chưa có biển để so sánh' })).toBeVisible();
  });
});
