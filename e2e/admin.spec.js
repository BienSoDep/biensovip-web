import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers.js';

test.describe('Admin', () => {
  test('login via demo button reaches dashboard with stats', async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByText('Tổng lượt xem')).toBeVisible();
    await expect(page.getByText('Yêu cầu liên hệ').first()).toBeVisible();
    await expect(page.getByText('Biển số được quan tâm nhất')).toBeVisible();
  });

  test('AdminPlates: add and delete a plate, search/filter', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Biển số', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Biển số' })).toBeVisible();

    // Quick-add row: plate number + price, system auto-detects province/vehicle type.
    const plateNo = '99Z9-' + (Date.now() % 1000) + '.99';
    await page.getByPlaceholder('43A1-999.99').fill(plateNo);
    await page.getByPlaceholder('Giá (VNĐ)').fill('100000000');
    await page.getByRole('button', { name: 'Thêm', exact: true }).click();
    await expect(page.getByText(plateNo)).toBeVisible({ timeout: 10000 });

    // search/filter
    await page.getByPlaceholder('Tìm biển số…').fill(plateNo);
    await page.waitForTimeout(300);
    await expect(page.getByText(plateNo)).toBeVisible();

    // delete
    const row = page.locator('div', { hasText: plateNo }).last();
    page.once('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Xóa' }).click();
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
    await expect(page.getByRole('heading', { name: 'Xác nhận xóa' })).toBeVisible();
    await page.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(page.getByText('Đã xóa danh mục')).toBeVisible();
  });

  test('AdminContacts: status dropdown updates', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Yêu cầu liên hệ' }).click();
    await expect(page.getByRole('heading', { name: 'Yêu cầu liên hệ' })).toBeVisible();

    // row-level status is a base-ui combobox (last combobox in the first data row —
    // "Phụ trách" assignee combobox comes first in DOM order within the row).
    await page.getByRole('combobox').last().click();
    await page.getByRole('option', { name: 'Đang tư vấn' }).click();
    await expect(page.getByText('Đã cập nhật trạng thái')).toBeVisible();
  });

  test('AdminPosts: delete a post', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Bài viết', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible();

    await page.getByRole('button', { name: 'Xóa' }).first().click();
    await expect(page.getByRole('heading', { name: 'Xóa bài viết' })).toBeVisible();
    await page.getByRole('button', { name: 'Xóa', exact: true }).last().click();
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
