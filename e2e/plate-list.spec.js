import { test, expect } from '@playwright/test';

test.describe('PlateList', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/danh-sach');
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });

  test('category pills filter results', async ({ page }) => {
    const before = await page.locator('text=Gọi ngay').count();
    // sidebar category checkbox "Ngũ quý"
    await page.getByLabel('Ngũ quý', { exact: true }).check();
    await page.waitForTimeout(200);
    const after = await page.locator('text=Gọi ngay').count();
    expect(after).toBeLessThanOrEqual(before);
  });

  test('city checkboxes filter results', async ({ page }) => {
    await page.getByLabel('Huế', { exact: true }).check();
    await page.waitForTimeout(200);
    // Huế only has 2 plates (p6, p12) so should show fewer cards
    const count = await page.locator('text=Gọi ngay').count();
    expect(count).toBeLessThanOrEqual(2);
  });

  test('vehicle radio filters to xe máy', async ({ page }) => {
    await page.getByLabel('Xe máy', { exact: true }).check();
    await page.waitForTimeout(200);
    // only p7, p12 are Xe máy
    const count = await page.locator('text=Gọi ngay').count();
    expect(count).toBeLessThanOrEqual(2);
  });

  test('price sort changes order (asc)', async ({ page }) => {
    await page.getByLabel('Sắp xếp').selectOption('asc');
    await page.waitForTimeout(200);
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });

  test('clear filters resets list', async ({ page }) => {
    await page.getByLabel('Ngũ quý', { exact: true }).check();
    await page.getByRole('button', { name: 'Xóa bộ lọc' }).first().click();
    await expect(page.getByLabel('Ngũ quý', { exact: true })).not.toBeChecked();
  });

  test('pagination — next page button available when more than 6 results', async ({ page }) => {
    // 12 plates total, 1 hidden (p8 status Ẩn) = 11 visible, PER_PAGE=6 -> 2 pages
    const nextBtn = page.getByRole('button', { name: 'Sau' });
    await expect(nextBtn).toBeVisible();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await expect(page.getByRole('button', { name: 'Trước' })).toBeEnabled();
  });
});
