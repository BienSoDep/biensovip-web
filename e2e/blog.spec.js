import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test('list renders published posts', async ({ page }) => {
    await page.goto('/#/tin');
    await expect(page.getByRole('heading', { name: 'Tin phong thủy' })).toBeVisible();
    const list = page.getByLabel('Danh sách bài viết');
    await expect(list.getByRole('heading', { level: 2 }).first()).toBeVisible();
    expect(await list.getByRole('heading', { level: 2 }).count()).toBeGreaterThan(0);
  });

  test('post detail navigation and related posts', async ({ page }) => {
    await page.goto('/#/tin');
    await page.getByRole('heading', { name: /Biển số ngũ quý/ }).click();
    await expect(page.getByRole('heading', { name: /Biển số ngũ quý/, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bài viết liên quan' })).toBeVisible();
  });
});
