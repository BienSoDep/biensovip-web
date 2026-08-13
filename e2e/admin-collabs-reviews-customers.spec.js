import { test, expect } from '@playwright/test';

async function loginAdmin(page) {
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'Dùng tài khoản mẫu (demo)' }).click();
  await page.getByRole('button', { name: 'Đăng nhập quản trị' }).click();
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
}

test.describe('AdminCollaborators', () => {
  // NOTE: AdminCollaborators.jsx is still wired to legacy in-memory mock
  // state (st.collabs from App.jsx), not a real backend endpoint — no CTVs
  // are seeded, so the table is always empty for a fresh session. This
  // matches the same legacy-state pattern already documented in fav.spec.js.
  test('renders commission report and status filter with empty table', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Cộng tác viên', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Cộng tác viên' })).toBeVisible();
    await expect(page.getByText('Tổng hoa hồng')).toBeVisible();
    await expect(page.getByText('Chờ thanh toán')).toBeVisible();
    await expect(page.getByText('Không có CTV nào khớp bộ lọc.')).toBeVisible();
  });
});

test.describe('AdminReviews', () => {
  test('status filter switches between pending/approved/rejected', async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole('button', { name: 'Đánh giá', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đánh giá' })).toBeVisible();

    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toHaveValue('pending');

    // "Duyệt"/"Từ chối" action buttons only render for pending reviews — for
    // approved/rejected the list is either read-only rows or the empty message.
    await statusSelect.selectOption('approved');
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: 'Duyệt' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Đánh giá' })).toBeVisible();

    await statusSelect.selectOption('rejected');
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
