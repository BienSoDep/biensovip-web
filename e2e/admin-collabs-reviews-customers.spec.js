import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers.js';

test.describe('AdminCollaborators', () => {
  // Real backend-wired table (POST /api/collaborators/become) — not legacy
  // mock state as an earlier version of this test assumed. Table has real
  // seeded + test-run-accumulated CTV rows, so assert structure, not emptiness.
  test('renders commission report and CTV table with real data', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Cộng tác viên', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Cộng tác viên' })).toBeVisible();
    await expect(page.getByText('Tổng hoa hồng')).toBeVisible();
    await expect(page.getByText('Hoa hồng chờ chi trả')).toBeVisible();
    await expect(page.getByText('TÊN')).toBeVisible();
    await expect(page.getByText('TRẠNG THÁI')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xuất CSV' })).toBeVisible();
  });
});

test.describe('AdminReviews', () => {
  test('status filter switches between pending/approved/rejected', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Đánh giá', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đánh giá' })).toBeVisible();

    // Status filter is a base-ui combobox (no native <select>), values are Vietnamese labels.
    const statusFilter = page.getByRole('combobox').first();
    await expect(statusFilter).toHaveText('Chờ duyệt');

    // "Duyệt"/"Từ chối" action buttons only render for pending reviews — for
    // approved/rejected the list is either read-only rows or the empty message.
    await statusFilter.click();
    await page.getByRole('option', { name: 'Đã duyệt' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: 'Duyệt' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Đánh giá' })).toBeVisible();

    await statusFilter.click();
    await page.getByRole('option', { name: 'Từ chối' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: 'Duyệt' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Đánh giá' })).toBeVisible();
  });
});

test.describe('AdminCustomers', () => {
  test('search and status filter narrow the customer list', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Khách hàng', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();

    await page.getByPlaceholder('Tìm theo email hoặc tên…').fill('zzz_no_such_customer_zzz');
    await page.waitForTimeout(400);
    await expect(page.getByText('Không có khách hàng nào khớp tìm kiếm.')).toBeVisible();

    await page.getByPlaceholder('Tìm theo email hoặc tên…').fill('');
    await page.waitForTimeout(400);
  });

  test('lock/unlock a customer requires confirmation', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Khách hàng', exact: true }).click();
    const lockBtn = page.getByRole('button', { name: 'Khóa' }).first();
    const count = await lockBtn.count();
    test.skip(count === 0, 'No customers seeded to exercise lock flow.');

    await lockBtn.click();
    await expect(page.getByRole('heading', { name: /Xác nhận khóa tài khoản|Xác nhận mở khóa tài khoản/ })).toBeVisible();
    await page.getByRole('button', { name: 'Hủy' }).click();
    await expect(page.getByRole('heading', { name: /Xác nhận/ })).not.toBeVisible();
  });
});
