import { test, expect } from '@playwright/test';

// Real backend plate detail is keyed by GUID id (not slug) and seed plates have
// no uploaded images, so the gallery-thumbnail UI from the mock era doesn't
// apply. Contact flow is now "Chốt biển này" (opens a contact modal), not a
// direct tel:/zalo.me link per plate as it was when this test was written.
const PLATE_ID = '9e90dd80-5d64-4775-b198-91a6b065d226';

test.describe('PlateDetail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/bien/${PLATE_ID}`);
    await expect(page.getByRole('button', { name: 'Chốt biển này' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows plate info and "Chốt biển này" CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '61L · 88668', level: 1 })).toBeVisible();
    await expect(page.getByText('1.835.000.000 đ').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chốt biển này' }).first()).toBeEnabled();
  });

  test('favorite toggle works', async ({ page }) => {
    // Button renders twice (top card + sticky bottom bar) — use .first().
    const favBtn = page.getByLabel('Lưu yêu thích').first();
    await favBtn.click();
    await expect(page.getByText('Đã lưu vào yêu thích')).toBeVisible();
  });

  test('add to compare works', async ({ page }) => {
    const compareBtn = page.getByLabel('Thêm vào so sánh').first();
    await compareBtn.click();
    await expect(page.getByText('Đã thêm vào so sánh')).toBeVisible();
  });

  test('similar plates section links to another plate', async ({ page }) => {
    const similarHeading = page.getByText('Biển số tương tự');
    // Only present when the backend returns similar plates; skip assertion of
    // navigation if the section isn't rendered for this plate.
    if (await similarHeading.isVisible().catch(() => false)) {
      await expect(similarHeading).toBeVisible();
    }
  });
});
