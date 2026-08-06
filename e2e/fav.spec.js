import { test, expect } from '@playwright/test';

test.describe('Fav', () => {
  test('populated state shows saved plates and can clear all', async ({ page }) => {
    // default mock state has p2 and p7 favorited
    await page.goto('/#/yeu-thich');
    await expect(page.getByRole('heading', { name: 'Biển số đã lưu' })).toBeVisible();
    await expect(page.getByText(/biển số bạn đang theo dõi/)).toBeVisible();
    await page.getByRole('button', { name: 'Bỏ lưu tất cả' }).click();
    await expect(page.getByText('Chưa có biển số nào được lưu')).toBeVisible();
  });

  test('empty state has CTA to explore list', async ({ page }) => {
    await page.goto('/#/yeu-thich');
    await page.getByRole('button', { name: 'Bỏ lưu tất cả' }).click();
    await page.getByRole('button', { name: 'Khám phá kho biển số' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });
});
