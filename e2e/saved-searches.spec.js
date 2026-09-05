import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers.js';

// SavedSearches (route: #/thong-bao) requires a logged-in user — the backend
// endpoint is per-user. We register+login a fresh user, save a search from
// the plate list (saving requires being logged in), then exercise
// rename/toggle-notify/delete on the saved item.

test.describe('SavedSearches', () => {
  // Guest (no auth token): page now shows a dedicated "please log in" prompt
  // instead of firing the API call and showing a load-error state.
  test('guest sees login prompt (no saved-searches API call)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('bsd_auth'));
    await page.goto('/thong-bao');
    await expect(page.getByRole('heading', { name: 'Đăng nhập để xem tiêu chí đã lưu' })).toBeVisible();
  });

  test('empty state has CTA to plate list (logged in, no saved searches)', async ({ page }) => {
    await registerAndLogin(page, 'saved');
    await page.goto('/thong-bao');
    await expect(page.getByRole('heading', { name: 'Chưa có tiêu chí nào' })).toBeVisible();
    await page.getByRole('button', { name: 'Vào danh sách biển' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });

  test('save, rename, toggle notify and delete a search', async ({ page }) => {
    await registerAndLogin(page, 'savedrename');

    await page.goto('/danh-sach');
    await page.getByLabel('Ngũ quý', { exact: true }).check();
    await page.getByRole('button', { name: 'Lưu tìm kiếm này' }).click();
    await expect(page.getByRole('heading', { name: 'Lưu tìm kiếm này' })).toBeVisible();
    const name = 'Tiêu chí test ' + Date.now();
    await page.getByLabel('Tên tiêu chí').fill(name);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText('Đã lưu tiêu chí tìm kiếm')).toBeVisible();

    await page.goto('/thong-bao');
    await expect(page.getByText(name)).toBeVisible();

    // inline rename via pencil icon
    await page.getByLabel('Đổi tên').click();
    const input = page.locator('input').first();
    const newName = name + ' (đổi tên)';
    await input.fill(newName);
    await page.keyboard.press('Enter');
    await expect(page.getByText('Đã đổi tên tiêu chí')).toBeVisible();
    await expect(page.getByText(newName)).toBeVisible();

    // toggle notify switch (Switch component: role="switch" aria-label="Thông báo")
    const notifySwitch = page.getByRole('switch', { name: 'Thông báo' });
    await notifySwitch.click();

    // delete — no aria-label on the trash button, but it's the only plain
    // <button> sibling of the switch in the row's action group.
    page.once('dialog', (d) => d.accept());
    await notifySwitch.locator('xpath=following-sibling::button').first().click();
    await expect(page.getByText('Đã xóa tiêu chí')).toBeVisible();
    await expect(page.getByText(newName)).not.toBeVisible();
  });
});
