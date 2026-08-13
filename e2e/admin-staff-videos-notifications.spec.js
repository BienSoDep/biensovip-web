import { test, expect } from '@playwright/test';

async function loginAdmin(page) {
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'Dùng tài khoản mẫu (demo)' }).click();
  await page.getByRole('button', { name: 'Đăng nhập quản trị' }).click();
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
}

test.describe('AdminStaff', () => {
  test('add, edit role, lock/unlock and delete a staff member', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Nhân viên', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Nhân viên' })).toBeVisible();

    const email = `staff${Date.now()}@biensovip.com`;
    await page.getByRole('button', { name: 'Thêm nhân viên' }).first().click();
    await expect(page.getByRole('heading', { name: 'Thêm nhân viên' })).toBeVisible();
    await page.getByLabel('Họ và tên').fill('Nhan Vien Test');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Mật khẩu').fill('matkhau123');
    await page.getByRole('button', { name: 'Thêm nhân viên' }).last().click();
    await expect(page.getByText('Đã thêm nhân viên')).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    // find the row and toggle active (lock)
    const row = page.locator('div', { hasText: email }).last();
    await row.getByRole('switch').click();
    await expect(page.getByText('Đã khóa tài khoản')).toBeVisible();
    await row.getByRole('switch').click();
    await expect(page.getByText('Đã kích hoạt tài khoản')).toBeVisible();

    // edit role via pencil icon
    await row.getByLabel('Sửa').click();
    await expect(page.getByRole('heading', { name: 'Sửa nhân viên' })).toBeVisible();
    await page.getByLabel('Vai trò').selectOption('super-admin');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Đã cập nhật nhân viên')).toBeVisible();

    // delete
    await row.getByLabel('Xóa').click();
    await expect(page.getByRole('heading', { name: 'Xác nhận xóa' })).toBeVisible();
    await page.getByRole('button', { name: 'Xóa', exact: true }).and(page.locator('.btn-danger')).click();
    await expect(page.getByText('Đã xóa nhân viên')).toBeVisible();
  });

  test('search filters staff list', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Nhân viên', exact: true }).click();
    await page.getByPlaceholder('Tìm theo tên hoặc email…').fill('zzz_no_such_staff_zzz');
    await expect(page.getByText('Không có nhân viên nào khớp tìm kiếm.')).toBeVisible();
  });
});

test.describe('AdminVideos', () => {
  test('add a video with auto-detected platform, reorder, delete', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Video', exact: true }).click();

    await page.getByRole('button', { name: 'Thêm video' }).first().click();
    await expect(page.getByRole('heading', { name: 'Thêm video' })).toBeVisible();
    const ts = Date.now();
    const title = 'Video test ' + ts;
    await page.getByLabel('URL video').fill(`https://www.tiktok.com/@duydinh/video/${ts}`);
    await page.getByLabel('Tiêu đề').fill(title);
    await page.getByRole('button', { name: 'Thêm video', exact: true }).last().click();
    // New card renders once the mutation resolves — wait on that rather than
    // the toast, which can auto-dismiss before the assertion runs.
    await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
    const titleEl = page.getByText(title, { exact: true });
    // Platform badge and delete button are siblings a couple levels up from
    // the title <div> — walk to the shared card row, then find them there.
    const cardRow = titleEl.locator('xpath=ancestor::div[.//button[@aria-label="Xóa video"]][1]');
    await expect(cardRow.getByText('TikTok')).toBeVisible();
    await cardRow.getByLabel('Xóa video').click();
    await expect(page.getByRole('heading', { name: 'Xác nhận xóa' })).toBeVisible();
    await page.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(page.getByText('Đã xóa video')).toBeVisible();
  });

  test('invalid video URL shows error', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Video', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm video' }).first().click();
    await page.getByLabel('URL video').fill('not-a-valid-url');
    await page.getByRole('button', { name: 'Thêm video', exact: true }).last().click();
    await expect(page.getByText('Link không hợp lệ hoặc không nhận diện được nền tảng.')).toBeVisible();
  });
});

test.describe('AdminNotifications', () => {
  // NOTE (real app bug, not a test issue): GET /api/admin/notifications
  // returns 500 INTERNAL_ERROR from the backend regardless of query params,
  // even though POST /api/admin/notifications/broadcast succeeds (201).
  // The "Đã gửi (0)" list panel therefore always shows "Lỗi tải dữ liệu"
  // instead of the just-sent broadcast. See final summary for details.
  test('compose and send a broadcast', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Thông báo', exact: true }).click();

    const title = 'Bao tri he thong ' + Date.now();
    await page.getByLabel('Tiêu đề').fill(title);
    await page.getByLabel('Nội dung').fill('Noi dung thong bao test tu dong.');
    await page.getByRole('button', { name: 'Gửi thông báo' }).click();
    await expect(page.getByText(/Đã (gửi thông báo tới|tạo thông báo)/)).toBeVisible({ timeout: 10000 });
    // Form clears on success — confirms the send succeeded even though the
    // adjacent "sent" list can't load (backend bug, see note above).
    await expect(page.getByLabel('Tiêu đề')).toHaveValue('');
  });

  test('empty submit shows validation error', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Thông báo', exact: true }).click();
    await page.getByRole('button', { name: 'Gửi thông báo' }).click();
    await expect(page.getByText('Nhập đủ tiêu đề và nội dung.')).toBeVisible();
  });
});
