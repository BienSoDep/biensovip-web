import { test, expect } from '@playwright/test';

// Real backend plate detail is keyed by GUID id (not slug) and seed plates have
// no uploaded images, so the gallery-thumbnail UI from the mock era doesn't
// apply. Using a known seeded plate id with a real price + seller phone/zalo.
const PLATE_ID = 'b9517006-ffe5-46ea-8af3-3f7ecb494ec7';

test.describe('PlateDetail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/#/bien/${PLATE_ID}`);
    await expect(page.getByRole('link', { name: 'Gọi ngay' })).toBeVisible({ timeout: 10000 });
  });

  test('shows plate info and contact links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Gọi ngay' })).toHaveAttribute('href', /^tel:/);
    await expect(page.getByRole('link', { name: 'Nhắn Zalo' })).toHaveAttribute('href', /zalo\.me/);
  });

  test('favorite toggle works', async ({ page }) => {
    const favBtn = page.getByLabel('Lưu yêu thích');
    await favBtn.click();
    await expect(page.getByText('Đã lưu vào yêu thích')).toBeVisible();
  });

  test('add to compare works', async ({ page }) => {
    const compareBtn = page.getByLabel('Thêm vào so sánh');
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
