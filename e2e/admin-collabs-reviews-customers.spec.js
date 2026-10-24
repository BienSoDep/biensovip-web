import { test, expect } from '@playwright/test';
import { loginAdmin, goToAdminScreen } from './helpers.js';

test.describe('AdminCollaborators', () => {
  // Real backend-wired table (POST /api/collaborators/become) — not legacy
  // mock state as an earlier version of this test assumed. Table has real
  // seeded + test-run-accumulated CTV rows, so assert structure, not emptiness.
  test('renders commission report and CTV table with real data', async ({ page }) => {
    await loginAdmin(page);
    await goToAdminScreen(page, 'Cộng tác viên');
    await expect(page.getByRole('heading', { name: 'Cộng tác viên' })).toBeVisible();
    await expect(page.getByText('Tổng hoa hồng')).toBeVisible();
    await expect(page.getByText('Hoa hồng chờ chi trả')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mã giới thiệu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trạng thái' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xuất CSV' })).toBeVisible();
  });
});

test.describe('AdminReviews', () => {
  test('status filter switches between pending/approved/rejected', async ({ page }) => {
    await loginAdmin(page);
    await goToAdminScreen(page, 'Đánh giá');
    await expect(page.getByRole('heading', { name: 'Đánh giá' })).toBeVisible();

    // Status filter is a segmented pill button list
    const pendingBtn = page.getByRole('button', { name: 'Chờ duyệt', exact: true });
    await expect(pendingBtn).toBeVisible();

    // "Duyệt"/"Từ chối" action buttons only render for pending reviews
    await page.getByRole('button', { name: 'Đã duyệt', exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Đánh giá' })).toBeVisible();

    await page.getByRole('button', { name: 'Đã từ chối', exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Đánh giá' })).toBeVisible();
  });
});

test.describe('AdminCustomers', () => {
  test('search and status filter narrow the customer list', async ({ page }) => {
    await loginAdmin(page);
    await goToAdminScreen(page, 'Khách hàng');
    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();

    const searchInput = (await page.getByPlaceholder(/Tìm nhanh/i).isVisible())
      ? page.getByPlaceholder(/Tìm nhanh/i)
      : page.getByPlaceholder(/Tìm theo email/i);

    await searchInput.fill('zzz_no_such_customer_zzz');
    await page.waitForTimeout(400);
    await expect(page.getByText(/Không tìm thấy khách hàng nào khớp bộ lọc|Không có khách hàng nào khớp bộ lọc/).filter({ visible: true })).toBeVisible();

    await searchInput.fill('');
    await page.waitForTimeout(400);
  });

  test('lock/unlock a customer requires confirmation', async ({ page }) => {
    await loginAdmin(page);
    await goToAdminScreen(page, 'Khách hàng');
    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();
    await page.waitForTimeout(1000);

    const lockBtn = page.getByRole('button', { name: /^(Khóa|Mở khóa|Mở)$/ }).filter({ visible: true }).first();
    const count = await lockBtn.count();
    test.skip(count === 0, 'No customers seeded to exercise lock flow.');

    await lockBtn.click();
    await expect(page.getByRole('heading', { name: /Xác nhận khóa tài khoản|Xác nhận mở khóa tài khoản/ })).toBeVisible();
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Xác nhận/ })).not.toBeVisible();
  });

  test('mobile customer bar toggles filters and card/table view', async ({ page }) => {
    await loginAdmin(page);
    await goToAdminScreen(page, 'Khách hàng');
    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();
    await page.waitForTimeout(1000);

    const filterBtn = page.getByRole('button', { name: /Bộ lọc/i }).filter({ visible: true });
    if (await filterBtn.isVisible()) {
      // Toggle open filters
      await filterBtn.click();
      await expect(page.locator('.admin-customers-filters.admin-filters-mobile-open')).toBeVisible();

      // Verify status tabs inside opened filters
      await expect(page.getByRole('button', { name: 'Hoạt động', exact: true }).filter({ visible: true })).toBeVisible();

      // Toggle closed
      await filterBtn.click();
      await expect(page.locator('.admin-customers-filters.admin-filters-mobile-open')).not.toBeVisible();

      // Toggle Table mode
      const tableToggle = page.getByRole('button', { name: 'Bảng', exact: true });
      await tableToggle.click();
      await expect(page.locator('.admin-customers-table-container.force-mobile-table')).toBeVisible();

      // Toggle Card mode
      const cardToggle = page.getByRole('button', { name: 'Thẻ', exact: true });
      await cardToggle.click();
      await expect(page.locator('.admin-customers-cards-container.is-active')).toBeVisible();
    }
  });
});
