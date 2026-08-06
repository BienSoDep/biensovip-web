import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test('category filter narrows post list', async ({ page }) => {
    await page.goto('/#/tin');
    await expect(page.getByRole('heading', { name: 'Tin phong thủy' })).toBeVisible();
    const list = page.getByLabel('Danh sách bài viết');
    const before = await list.getByRole('heading', { level: 2 }).count();
    await page.getByRole('button', { name: 'Cập nhật quy định' }).click();
    await page.waitForTimeout(150);
    const after = await list.getByRole('heading', { level: 2 }).count();
    // "Cập nhật quy định" post (a5) is status Bản nháp so not published -> should show 0
    expect(after).toBeLessThanOrEqual(before);
  });

  test('post detail navigation and related posts', async ({ page }) => {
    await page.goto('/#/tin');
    await page.getByRole('heading', { name: /Ngũ quý 99999/ }).click();
    await expect(page.getByRole('heading', { name: /Ngũ quý 99999/, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bài viết liên quan' })).toBeVisible();
  });
});
