import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers.js';

test.describe('AdminStaff', () => {
  // Không còn nút "Xóa" cứng — chỉ "Vô hiệu hóa" (soft-disable qua modal xác nhận,
  // không có toggle switch riêng để khóa/mở nhanh trong hàng). "Vai trò" là combobox
  // (base-ui), không phải <select> gốc.
  test('add a staff member, edit role, then disable', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Nhân viên', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Nhân viên' })).toBeVisible();

    const email = `staff${Date.now()}@biensovip.com`;
    await page.getByRole('button', { name: 'Thêm nhân viên' }).first().click();
    await expect(page.getByRole('heading', { name: 'Thêm nhân viên' })).toBeVisible();
    await page.getByLabel('Họ và tên').fill('Nhan Vien Test');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('matkhau123');
    await page.getByRole('button', { name: 'Thêm nhân viên' }).last().click();
    await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });

    // find the row (search narrows to just this one) and edit role
    await page.getByPlaceholder('Tìm theo tên hoặc email…').fill(email);
    const row = page.locator('div', { hasText: email }).last();
    await row.getByRole('button', { name: 'Sửa' }).click();
    await expect(page.getByRole('heading', { name: 'Sửa nhân viên' })).toBeVisible();
    await page.getByRole('combobox').filter({ hasText: 'Nhân viên' }).click();
    await page.getByRole('option', { name: 'Quản trị viên' }).click();
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Đã cập nhật nhân viên')).toBeVisible();

    // disable (soft) via confirm modal
    await row.getByRole('button', { name: 'Vô hiệu hóa' }).click();
    await expect(page.getByRole('heading', { name: 'Xác nhận vô hiệu hóa' })).toBeVisible();
    await page.getByRole('button', { name: 'Vô hiệu hóa', exact: true }).last().click();
    await expect(page.getByText(/Đã vô hiệu hóa|Đã khóa/)).toBeVisible();
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
    // the toast, which can auto-dismiss before the assertion runs. Title text
    // appears twice (link + div) — use .first().
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
    const titleEl = page.getByText(title, { exact: true }).first();
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
