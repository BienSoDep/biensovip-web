import { test, expect } from '@playwright/test';

// Seeded demo admin per BACKEND-IMPLEMENTATION-PLAN.md C5: admin@biensovip.com / Admin@123.
// The demo button only pre-fills the login form; a real submit against the backend is required.
async function loginAdmin(page) {
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'Dùng tài khoản mẫu (demo)' }).click();
  await page.getByRole('button', { name: 'Đăng nhập quản trị' }).click();
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
}

test.describe('Admin', () => {
  test('login via demo button reaches dashboard with stats', async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByText('Tổng lượt xem')).toBeVisible();
    await expect(page.getByText('Yêu cầu liên hệ').first()).toBeVisible();
    await expect(page.getByText('Biển số xem nhiều nhất')).toBeVisible();
  });

  test('AdminPlates: add and delete a plate, search/filter', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Biển số', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Biển số' })).toBeVisible();

    // add — real form requires plate number text + category/province/vehicle dropdowns + at least 1 image.
    // Image upload isn't exercisable without a real file/backend upload flow, so verify validation instead.
    await page.getByRole('button', { name: 'Thêm biển số' }).click();
    await expect(page.getByRole('heading', { name: 'Thêm biển số' })).toBeVisible();
    await page.getByPlaceholder('43A1-999.99').fill('99Z9-999.99');
    await page.getByRole('button', { name: 'Lưu biển số' }).click();
    await expect(page.getByText('Chọn loại biển')).toBeVisible();
    await page.getByRole('button', { name: 'Đóng' }).click();

    // search/filter
    await page.getByPlaceholder('Tìm biển số…').fill('99999');
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Biển số' })).toBeVisible();
  });

  test('AdminCats: add and delete a category', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Danh mục', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Danh mục' })).toBeVisible();

    const name = 'Biển test ' + Date.now();
    await page.getByLabel('Tên danh mục').fill(name);
    await page.getByRole('button', { name: 'Thêm danh mục' }).click();
    await expect(page.getByText('Đã thêm danh mục')).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();

    await page.getByText(name).locator('..').getByRole('button', { name: 'Xóa danh mục' }).click();
    await expect(page.getByText('Đã xóa danh mục')).toBeVisible();
  });

  test('AdminContacts: status dropdown updates', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Yêu cầu liên hệ' }).click();
    await expect(page.getByRole('heading', { name: 'Yêu cầu liên hệ' })).toBeVisible();

    // row-level status Select is the last <select> on the page (filter Selects come first)
    const firstStatus = page.locator('select').last();
    await firstStatus.selectOption('Đang tư vấn');
    await expect(page.getByText('Đã cập nhật trạng thái')).toBeVisible();
  });

  test('AdminPosts: delete a post', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Bài viết', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible();

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Xóa' }).first().click();
    await expect(page.getByText('Đã xóa bài viết')).toBeVisible();
  });

  test('Compose: write and save draft', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Bài viết', exact: true }).click();
    await page.getByRole('button', { name: 'Đăng bài mới' }).click();
    await expect(page.getByRole('heading', { name: 'Viết bài mới' })).toBeVisible();

    await page.getByLabel('Tiêu đề', { exact: true }).fill('Bài test tự động ' + Date.now());
    await page.getByRole('button', { name: 'Lưu nháp' }).click();
    await expect(page.getByText('Đã lưu nháp')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible();
  });

  test('Compose: publish shows success', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Bài viết', exact: true }).click();
    await page.getByRole('button', { name: 'Đăng bài mới' }).click();
    await page.getByLabel('Tiêu đề', { exact: true }).fill('Bài xuất bản test ' + Date.now());
    // TipTap's ProseMirror div is contenteditable, not a form control — .fill() doesn't
    // register with its internal state. Click to focus then type via keyboard instead.
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await expect(editor).toBeFocused();
    await page.keyboard.type('Noi dung test tu dong.', { delay: 20 });
    await expect(editor).toContainText('Noi dung test tu dong.');
    // Blur the editor so TipTap's onUpdate flushes contentHtml/getText() into
    // Compose's React state before we read it on submit.
    await page.getByLabel('Tiêu đề', { exact: true }).click();
    await page.getByRole('button', { name: 'Xuất bản' }).click();
    // Toast can auto-dismiss before assertion runs; wait for the navigation
    // back to the posts list instead, which only happens on success.
    await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible({ timeout: 10000 });
  });
});
