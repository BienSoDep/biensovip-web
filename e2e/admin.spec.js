import { test, expect } from '@playwright/test';

async function loginAdmin(page) {
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'Dùng tài khoản mẫu (demo)' }).click();
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
}

test.describe('Admin', () => {
  test('login via demo button reaches dashboard with stats', async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByText('Tổng biển số')).toBeVisible();
    await expect(page.getByText('Yêu cầu mới')).toBeVisible();
    await expect(page.getByText('Yêu cầu liên hệ gần đây')).toBeVisible();
  });

  test('AdminPlates: add, edit, delete a plate, search/filter', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Biển số', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Biển số' })).toBeVisible();

    // add
    await page.getByRole('button', { name: 'Thêm biển số' }).first().click();
    await page.getByLabel('Mã tỉnh').fill('43');
    await page.getByLabel('Seri').fill('Z9');
    await page.getByLabel('Số biển').fill('123.45');
    await page.getByRole('button', { name: 'Thêm biển số' }).last().click();
    await expect(page.getByText('Đã thêm biển số mới')).toBeVisible();
    await expect(page.getByText('43Z9')).toBeVisible();

    // search/filter
    await page.getByPlaceholder('Tìm trong bảng…').fill('Z9');
    await page.waitForTimeout(150);
    await expect(page.getByText('43Z9')).toBeVisible();

    // edit
    await page.getByRole('button', { name: 'Sửa' }).first().click();
    await expect(page.getByRole('heading', { name: 'Sửa biển số' })).toBeVisible();
    await page.getByLabel('Giá').fill('999.000.000');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Đã cập nhật biển số')).toBeVisible();

    // delete
    await page.getByRole('button', { name: 'Xóa' }).first().click();
    await expect(page.getByRole('heading', { name: 'Xác nhận xóa' })).toBeVisible();
    const confirmModal = page.getByRole('heading', { name: 'Xác nhận xóa' }).locator('..');
    await confirmModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(page.getByText('Đã xóa')).toBeVisible();
  });

  test('AdminCats: add and delete a category', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Danh mục', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Danh mục' })).toBeVisible();

    await page.getByLabel('Tên danh mục').fill('Biển test');
    await page.getByRole('button', { name: 'Thêm danh mục' }).click();
    await expect(page.getByText('Đã thêm danh mục')).toBeVisible();
    await expect(page.getByText('Biển test')).toBeVisible();

    await page.getByRole('button', { name: 'Xóa danh mục' }).last().click();
    const confirmModal = page.getByRole('heading', { name: 'Xác nhận xóa' }).locator('..');
    await confirmModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(page.getByText('Đã xóa')).toBeVisible();
  });

  test('AdminContacts: status dropdown updates and sync toggle', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Yêu cầu liên hệ' }).click();
    await expect(page.getByRole('heading', { name: 'Yêu cầu liên hệ' })).toBeVisible();

    const firstStatus = page.locator('select').first();
    await firstStatus.selectOption('Đã chốt');
    await expect(page.getByText('Đã cập nhật trạng thái')).toBeVisible();

    await expect(page.getByText('Đồng bộ yêu cầu về Google Sheet')).toBeVisible();
  });

  test('AdminPosts: delete a post', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Bài viết', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible();
    await page.getByRole('button', { name: 'Xóa' }).first().click();
    const confirmModal = page.getByRole('heading', { name: 'Xác nhận xóa' }).locator('..');
    await confirmModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(page.getByText('Đã xóa')).toBeVisible();
  });

  test('Compose: write, save draft, publish, insert-plate picker', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Bài viết', exact: true }).click();
    await page.getByRole('button', { name: 'Đăng bài mới' }).click();
    await expect(page.getByRole('heading', { name: 'Viết bài mới' })).toBeVisible();

    await page.getByLabel('Tiêu đề').fill('Bài test tự động');
    await page.getByRole('button', { name: 'Chèn biển số liên quan' }).click();
    await expect(page.getByText('Chọn biển để chèn')).toBeVisible();

    await page.getByRole('button', { name: 'Lưu nháp' }).click();
    await expect(page.getByText('Đã lưu nháp')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible();
  });

  test('Compose: publish shows success', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Bài viết', exact: true }).click();
    await page.getByRole('button', { name: 'Đăng bài mới' }).click();
    await page.getByLabel('Tiêu đề').fill('Bài xuất bản test');
    await page.getByRole('button', { name: 'Xuất bản' }).click();
    await expect(page.getByText('Đã xuất bản bài viết')).toBeVisible();
  });
});
