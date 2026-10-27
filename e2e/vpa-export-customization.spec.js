import { test, expect } from '@playwright/test';

test.describe('VPA & Shop Plates Export Customization (Motorbike & Province Options)', () => {
  test('Admin can customize vehicle type and select individual provinces for Excel and Docx export', async ({ page }) => {
    // 1. Mock authentication
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, json: { message: 'Not a regular user' } })
    );

    await page.route('**/api/admin/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock.eyJleHAiOjk5OTk5OTk5OTl9.sig',
            refreshToken: 'mock-ref-token',
            admin: {
              id: '00000000-0000-0000-0000-000000000001',
              fullName: 'Quản Trị Viên',
              role: 'super-admin',
              permissions: ['*'],
            },
          },
        }),
      })
    );

    // Mock provinces category
    const mockProvinces = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Hà Nội', code: '29', region: 'bac', group: 'province' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'TP. Hồ Chí Minh', code: '51', region: 'nam', group: 'province' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Đà Nẵng', code: '43', region: 'trung', group: 'province' },
      { id: '44444444-4444-4444-4444-444444444444', name: 'Hải Phòng', code: '15', region: 'bac', group: 'province' },
      { id: '55555555-5555-5555-5555-555555555555', name: 'Cần Thơ', code: '65', region: 'nam', group: 'province' },
      { id: '66666666-6666-6666-6666-666666666666', name: 'Nghệ An', code: '37', region: 'trung', group: 'province' },
      { id: '77777777-7777-7777-7777-777777777777', name: 'Bình Dương', code: '61', region: 'nam', group: 'province' },
    ];

    await page.route('**/api/admin/categories**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockProvinces }),
      });
    });

    await page.route('**/api/categories**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockProvinces }),
      });
    });

    // Mock stats & counts
    await page.route('**/api/admin/vpa/stats', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalPlates: 10000,
            byVehicle: { Car: 7000, MotorBike: 3000 },
            byTab: { Week: 1000, Month: 4000, Expired: 5000 },
          },
        }),
      });
    });

    await page.route('**/api/admin/vpa/plates/export/counts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            all: 12500,
            vpa: 10000,
            available: 2500,
            shop: 2500,
            month: 4000,
            week: 1000,
            expired: 5000,
          },
        }),
      });
    });

    await page.route('**/api/admin/plates**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 2500, page: 1, perPage: 20 },
        }),
      });
    });

    // Track export job POST requests
    let capturedExportParams = null;
    await page.route('**/api/admin/vpa/plates/export/jobs**', (route) => {
      const url = new URL(route.request().url());
      capturedExportParams = Object.fromEntries(url.searchParams.entries());
      route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { jobId: 'e2e-job-12345' } }),
      });
    });

    // 2. Perform Admin Login
    await page.goto('/dang-nhap');
    await page.getByLabel('Email hoặc số điện thoại').fill('admin@biensovip.com');
    await page.locator('input[type="password"]').first().fill('admin@123');
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    // 3. Navigate to Admin VPA Stats using sidebar
    const statsNav = page.getByRole('button', { name: 'Thống kê Biển số & VPA', exact: true });
    await expect(statsNav).toBeVisible({ timeout: 10000 });
    await statsNav.click();

    await expect(page.getByRole('heading', { name: 'Thống Kê & Báo Cáo Biển Số' })).toBeVisible({ timeout: 10000 });

    // 4. Click "Xuất dữ liệu biển số" button
    const openExportBtn = page.getByRole('button', { name: 'Xuất dữ liệu biển số' });
    await expect(openExportBtn).toBeVisible();
    await openExportBtn.click();

    // 5. Verify modal opens
    const modalHeading = page.getByRole('heading', { name: 'Tùy chọn xuất dữ liệu biển số' });
    await expect(modalHeading).toBeVisible();

    // 6. Test Vehicle Type Selector: Choose "Chỉ Xe máy 🛵"
    const bikeOption = page.getByTestId('vehicle-option-2');
    await expect(bikeOption).toBeVisible();
    await bikeOption.click();
    await expect(page.getByText('Đang lọc riêng Xe máy')).toBeVisible();

    // 7. Test Province Mode: Switch from "Toàn bộ 63 Tỉnh" to "Tùy chọn từng Tỉnh/Thành"
    const customProvBtn = page.getByTestId('province-mode-custom');
    await expect(customProvBtn).toBeVisible();
    await customProvBtn.click();

    // Check that province actions appear
    await expect(page.getByText('Chọn nhanh:')).toBeVisible();
    await expect(page.getByRole('button', { name: /Top 5 TP lớn/i })).toBeVisible();

    // Click "Bỏ chọn" first
    await page.getByRole('button', { name: 'Bỏ chọn' }).click();

    // Use search input to find "Hà Nội"
    const searchInput = page.getByPlaceholder('Tìm tỉnh (Hà Nội, 29...)');
    await searchInput.fill('Hà Nội');

    // Click on Hà Nội chip to select it
    const hanoiChip = page.getByText('Hà Nội', { exact: true });
    await expect(hanoiChip).toBeVisible();
    await hanoiChip.click();

    // Verify info text shows 1 province selected
    await expect(page.getByText(/File Excel sẽ xuất duy nhất 1 sheet của tỉnh: "Hà Nội"/i)).toBeVisible();

    // 8. Submit Export
    const submitBtn = page.getByTestId('export-submit-btn');
    await expect(submitBtn).toBeVisible();
    const [exportReq] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/admin/vpa/plates/export/jobs')),
      submitBtn.click(),
    ]);

    // 9. Verify that modal closed and API was called with vehicle=2 and provinceIds matching Hanoi
    await expect(modalHeading).toBeHidden();
    const params = Object.fromEntries(new URL(exportReq.url()).searchParams.entries());
    expect(params.vehicle).toBe('2');
    expect(params.format).toBe('xlsx');
    expect(params.provinceIds).toContain('11111111-1111-1111-1111-111111111111');
  });

  test('Admin can select Word format for Motorbike catalogue export', async ({ page }) => {
    // Mock routes
    await page.route('**/api/auth/login', (route) => route.fulfill({ status: 401 }));
    await page.route('**/api/admin/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock.eyJleHAiOjk5OTk5OTk5OTl9.sig',
            refreshToken: 'mock-ref-token',
            admin: { id: '00000000-0000-0000-0000-000000000001', fullName: 'Admin', role: 'super-admin', permissions: ['*'] },
          },
        }),
      })
    );

    await page.route('**/api/admin/vpa/**', (route) => {
      if (route.request().url().includes('export/jobs')) {
        return route.fallback();
      }
      return route.fulfill({ status: 200, json: { success: true, data: {} } });
    });
    await page.route('**/api/admin/categories**', (route) => route.fulfill({ status: 200, json: { success: true, data: [] } }));

    let capturedParams = null;
    await page.route('**/api/admin/vpa/plates/export/jobs**', (route) => {
      const url = new URL(route.request().url());
      capturedParams = Object.fromEntries(url.searchParams.entries());
      route.fulfill({ status: 202, json: { success: true, data: { jobId: 'e2e-word-job' } } });
    });

    await page.goto('/dang-nhap');
    await page.getByLabel('Email hoặc số điện thoại').fill('admin@biensovip.com');
    await page.locator('input[type="password"]').first().fill('admin@123');
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    const statsNav = page.getByRole('button', { name: 'Thống kê Biển số & VPA', exact: true });
    await expect(statsNav).toBeVisible({ timeout: 10000 });
    await statsNav.click();

    await page.getByRole('button', { name: 'Xuất dữ liệu biển số' }).click();

    // Select "Chỉ Xe máy 🛵"
    const bikeOption = page.getByTestId('vehicle-option-2');
    await expect(bikeOption).toBeVisible();
    await bikeOption.click();

    // Select Word format
    await page.getByText('Word (.docx)').click();

    // Submit
    const wordSubmitBtn = page.getByTestId('export-submit-btn');
    await expect(wordSubmitBtn).toBeVisible();
    const [wordReq] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/admin/vpa/plates/export/jobs')),
      wordSubmitBtn.click(),
    ]);

    const wordParams = Object.fromEntries(new URL(wordReq.url()).searchParams.entries());
    expect(wordParams.format).toBe('docx');
    expect(wordParams.vehicle).toBe('2');
  });
});
