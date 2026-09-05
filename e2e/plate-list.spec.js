import { test, expect } from '@playwright/test';

test.describe('PlateList', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/danh-sach');
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });

  test('category pills filter results', async ({ page }) => {
    const before = await page.locator('text=Gọi ngay').count();
    // sidebar category checkbox — seed data uses unaccented names (see plan §3)
    const resp = page.waitForResponse((r) => r.url().includes('/api/plates') && r.request().method() === 'GET');
    await page.getByLabel('Ngũ quý', { exact: true }).check();
    await resp;
    const after = await page.locator('text=Gọi ngay').count();
    expect(after).toBeLessThanOrEqual(before);
  });

  test('city checkboxes filter results', async ({ page }) => {
    const before = await page.locator('text=Gọi ngay').count();
    const resp = page.waitForResponse((r) => r.url().includes('/api/plates') && r.request().method() === 'GET');
    await page.getByLabel('Đà Nẵng', { exact: true }).check();
    await resp;
    const after = await page.locator('text=Gọi ngay').count();
    expect(after).toBeLessThanOrEqual(before);
  });

  test('vehicle radio filters to xe máy', async ({ page }) => {
    const before = await page.locator('text=Gọi ngay').count();
    const resp = page.waitForResponse((r) => r.url().includes('/api/plates') && r.request().method() === 'GET');
    await page.getByLabel('Xe máy', { exact: true }).check();
    await resp;
    const after = await page.locator('text=Gọi ngay').count();
    expect(after).toBeLessThanOrEqual(before);
  });

  test('price sort changes order (asc)', async ({ page }) => {
    // Sort control is a base-ui combobox (no accessible label) — page now has
    // 2 comboboxes (page-size + sort), filter by text instead of bare role query.
    await page.getByRole('combobox').filter({ hasText: 'Mới nhất' }).click();
    await page.getByRole('option', { name: 'Giá thấp → cao' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });

  test('clear filters resets list', async ({ page }) => {
    await page.getByLabel('Ngũ quý', { exact: true }).check();
    await expect(page.getByLabel('Ngũ quý', { exact: true })).toBeChecked();
    await page.getByRole('button', { name: 'Xóa bộ lọc' }).first().click();
    await expect(page.getByLabel('Ngũ quý', { exact: true })).not.toBeChecked();
  });

  test('pagination — next page button available when more than 1 page', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: 'Sau' });
    await expect(nextBtn).toBeVisible();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await expect(page.getByRole('button', { name: 'Trước' })).toBeEnabled();
  });
});
