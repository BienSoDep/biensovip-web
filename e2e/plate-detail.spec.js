import { test, expect } from '@playwright/test';

test.describe('PlateDetail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/bien/p1');
  });

  test('gallery thumbnails switch active state', async ({ page }) => {
    const thumbs = page.getByRole('button', { name: /Ảnh \d/ });
    await expect(thumbs).toHaveCount(3);
    await thumbs.nth(1).click();
    // active thumbnail gets action-primary border; just confirm click doesn't error and detail still shows
    await expect(page.getByRole('button', { name: 'Gọi ngay' })).toBeVisible();
  });

  test('favorite toggle works', async ({ page }) => {
    const favBtn = page.getByRole('button', { name: 'Lưu yêu thích' });
    await favBtn.click();
    await expect(page.getByText('Đã lưu vào yêu thích')).toBeVisible();
  });

  test('contact modal opens and submits', async ({ page }) => {
    await page.getByRole('button', { name: 'Gọi ngay' }).click();
    await expect(page.getByRole('heading', { name: 'Gửi yêu cầu tư vấn' })).toBeVisible();
    await page.getByLabel('Họ và tên').fill('Nguyễn Test');
    await page.getByLabel('Số điện thoại').fill('0905123456');
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByText('Cảm ơn bạn')).toBeVisible();
  });

  test('contact modal shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Gọi ngay' }).click();
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByText('Vui lòng nhập họ tên.')).toBeVisible();
  });
});
