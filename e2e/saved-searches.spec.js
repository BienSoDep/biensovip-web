import { test, expect } from '@playwright/test';

// SavedSearches (route: #/thong-bao) requires a logged-in user — the backend
// endpoint is per-user. We register+login a fresh user, save a search from
// the plate list (saving requires being logged in), then exercise
// rename/toggle-notify/delete on the saved item.
async function registerAndLogin(page) {
  const email = `saved${Date.now()}@example.com`;
  await page.goto('/#/dang-ky');
  await page.getByLabel('Họ và tên').fill('Saved Search Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill('matkhau123');
  await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
  await page.getByRole('button', { name: 'Đăng ký' }).click();
  await expect(page.getByText('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')).toBeVisible();

  await page.goto('/#/dang-nhap');
  await page.getByLabel('Email hoặc số điện thoại').fill(email);
  await page.getByLabel('Mật khẩu').fill('matkhau123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByText('Đăng nhập thành công')).toBeVisible();
}

test.describe('SavedSearches', () => {
  // Guest (no auth token): /api/me/saved-searches returns 401, so the page
  // shows the fetch-error state, not the "no items" empty state.
  test('guest sees load-error state (endpoint requires auth)', async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.removeItem('bsd_auth'));
    await page.goto('/#/thong-bao');
    await expect(page.getByText('Không tải được danh sách tiêu chí.')).toBeVisible();
  });

  test('empty state has CTA to plate list (logged in, no saved searches)', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/#/thong-bao');
    await expect(page.getByRole('heading', { name: 'Chưa có tiêu chí nào' })).toBeVisible();
    await page.getByRole('button', { name: 'Vào danh sách biển' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });

  test('save, rename, toggle notify and delete a search', async ({ page }) => {
    await registerAndLogin(page);

    await page.goto('/#/danh-sach');
    await page.getByLabel('Ngu quy', { exact: true }).check();
    await page.getByRole('button', { name: 'Lưu tìm kiếm này' }).click();
    await expect(page.getByRole('heading', { name: 'Lưu tìm kiếm này' })).toBeVisible();
    const name = 'Tiêu chí test ' + Date.now();
    await page.getByLabel('Tên tiêu chí').fill(name);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText('Đã lưu tiêu chí tìm kiếm')).toBeVisible();

    await page.goto('/#/thong-bao');
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
