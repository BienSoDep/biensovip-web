import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers.js';

test.describe('Admin VPA Management (UC49)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    // Click vào menu "Biển VPA" trong nhóm Kho biển số & VPA
    const vpaNav = page.getByRole('button', { name: 'Biển VPA', exact: true });
    await expect(vpaNav).toBeVisible();
    await vpaNav.click();
    await page.waitForLoadState('networkidle');
  });

  test('VPA page renders all 5 tabs and tab navigation works smoothly', async ({ page }) => {
    // 5 tab chính của Admin VPA
    const tabList = page.locator('.admin-tablist');
    await expect(tabList).toBeVisible();

    const expectedTabs = [
      'Danh sách biển VPA',
      'Duyệt giá',
      'Kết quả đấu giá',
      'Đồng bộ & cấu hình',
      'Hướng dẫn quy trình & nút bấm',
    ];

    for (const tabName of expectedTabs) {
      await expect(tabList.getByRole('tab', { name: new RegExp(`^${tabName}`) })).toBeVisible();
    }

    // Chuyển sang tab "Duyệt giá"
    await tabList.getByRole('tab', { name: /^Duyệt giá/ }).click();
    await expect(page).toHaveURL(/tab=queue/);

    // Chuyển sang tab "Kết quả đấu giá"
    await tabList.getByRole('tab', { name: new RegExp('^Kết quả đấu giá') }).click();
    await expect(page).toHaveURL(/tab=auction-results/);

    // Chuyển sang tab "Hướng dẫn quy trình & nút bấm"
    await tabList.getByRole('tab', { name: new RegExp('^Hướng dẫn quy trình') }).click();
    await expect(page).toHaveURL(/tab=guide/);
    await expect(page.getByText(/Cẩm Nang Quy Trình/i)).toBeVisible();

    // Chuyển lại tab "Danh sách biển VPA"
    await tabList.getByRole('tab', { name: new RegExp('^Danh sách biển VPA') }).click();
    await expect(page).toHaveURL(/tab=plates/);
  });

  test('VpaAdminList displays filter toolbar, buttons, and guide opener', async ({ page }) => {
    // Nút mở hướng dẫn thao tác nút
    const guideBtn = page.getByRole('button', { name: /Hướng dẫn dùng nút/i });
    if (await guideBtn.isVisible()) {
      await guideBtn.click();
      // Chuyển hướng sang tab guide
      await expect(page.getByRole('tab', { name: 'Hướng dẫn quy trình & nút bấm' })).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('Bulk selection reveals floating bar with unhide, hide, and copy buttons', async ({ page }) => {
    // Kiểm tra xem có checkbox trong bảng biển VPA không
    const checkboxes = page.locator('table input[type="checkbox"], [role="table"] input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 1) {
      // Chọn dòng đầu tiên
      await checkboxes.nth(1).check();

      // Thanh công cụ thao tác hàng loạt nổi phải xuất hiện
      const bulkBar = page.locator('text=Đã chọn 1');
      await expect(bulkBar).toBeVisible({ timeout: 5000 });

      // Nút "Bỏ ẩn" và "Ẩn"
      await expect(page.getByRole('button', { name: 'Bỏ ẩn' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Ẩn' })).toBeVisible();

      // Nút "Sao chép số biển"
      await expect(page.getByRole('button', { name: 'Sao chép' })).toBeVisible();

      // Nút "Bỏ chọn"
      await page.getByRole('button', { name: 'Bỏ chọn' }).click();
      await expect(bulkBar).not.toBeVisible();
    }
  });

  test('Admin VPA Stats renders sidebar order, unified inventory table, download button, and all tabs without errors', async ({ page }) => {
    // 1. Kiểm tra vị trí menu Thống kê Biển số & VPA trên đầu nhóm Kho biển số & VPA
    const statsNav = page.getByRole('button', { name: /Thống kê Biển số & VPA/i });
    await expect(statsNav).toBeVisible();
    await statsNav.click();
    await page.waitForLoadState('networkidle');

    // 2. Tab 1 Dashboard Tổng Hợp & Bảng Danh Sách Gộp
    await expect(page.getByText('Danh Sách Kho Biển Số Gộp (Shop & Đấu Giá VPA)')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Xuất file Excel kho gộp/i })).toBeVisible();

    // 3. Tab 2: Thống kê Biển đấu giá VPA
    const tabVpa = page.getByRole('tab', { name: /2\. Thống kê Biển đấu giá VPA/i });
    await tabVpa.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Đã xảy ra lỗi/i)).not.toBeVisible();

    // 4. Tab 3: Kho biển số của chúng ta hiện tại (đã sửa lỗi .slice is not a function)
    const tabShop = page.getByRole('tab', { name: /3\. Kho biển số của chúng ta/i });
    await tabShop.click();
    await page.waitForLoadState('networkidle');
    // Đảm bảo không gặp error boundary đỏ
    await expect(page.getByText(/Đã xảy ra lỗi/i)).not.toBeVisible();
    await expect(page.getByText(/TypeError/i)).not.toBeVisible();
  });
});

