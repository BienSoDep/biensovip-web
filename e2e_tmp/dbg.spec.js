const { test, expect } = require('@playwright/test');
test('debug', async ({ page }) => {
  await page.goto('/#/danh-sach');
  await page.waitForTimeout(1000);
  const btn = page.getByLabel(/Lưu yêu thích/).first();
  await expect(btn).toBeVisible();
  await btn.click();
  await page.waitForTimeout(500);
  console.log(await page.evaluate(() => localStorage.getItem('biensovip_local_favorites') || localStorage.getItem('local_favorites') || JSON.stringify(Object.keys(localStorage))));
});
