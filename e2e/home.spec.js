import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hero renders with heading and CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Chọn biển số đẹp/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xem kho biển số' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nhắn Zalo tư vấn' })).toBeVisible();
  });

  test('search/filter pills switch category', async ({ page }) => {
    const pill = page.getByRole('button', { name: 'Ngũ quý', exact: true }).first();
    await pill.click();
    await expect(pill).toHaveAttribute('data-on', 'true');
  });

  test('featured plates grid shows cards', async ({ page }) => {
    // plate cards render price text ending in "đ" or "Giá liên hệ"
    const cards = page.locator('text=Gọi ngay');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('CTA navigates to plate list', async ({ page }) => {
    await page.getByRole('button', { name: 'Xem kho biển số' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });
});
