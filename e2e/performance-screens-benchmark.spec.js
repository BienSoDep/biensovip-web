import { test, expect } from '@playwright/test';

test.describe('Performance & Load Speed Benchmark Across Key Screens', () => {
  const mockProvinces = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Hà Nội', code: '29', region: 'bac', group: 'province' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'TP. Hồ Chí Minh', code: '51', region: 'nam', group: 'province' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Đà Nẵng', code: '43', region: 'trung', group: 'province' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Hải Phòng', code: '15', region: 'bac', group: 'province' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'Cần Thơ', code: '65', region: 'nam', group: 'province' },
  ];

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => console.log('[PAGE ERROR]:', err.message, err.stack));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('[CONSOLE ERROR]:', msg.text());
    });
    page.on('response', (res) => {
      if (res.status() >= 400) console.log('[RES ERROR]:', res.url(), res.status());
    });

    // 1. Mock Authentication
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

    // Mock categories
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
    await page.route('**/api/admin/vpa/stats**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalCount: 10000,
            approvedCount: 2500,
            byVehicle: { Car: 7000, MotorBike: 3000 },
            byTab: { Week: 1000, Month: 4000, Expired: 5000 },
            byState: { Approved: 2500, Suggested: 500, Pending: 7000 },
            priceRanges: [
              { label: '< 40 triệu', count: 5000 },
              { label: '40 - 100 triệu', count: 3000 },
              { label: '≥ 100 triệu', count: 2000 },
            ],
            byProvince: [
              { label: 'Hà Nội', count: 3500 },
              { label: 'TP. Hồ Chí Minh', count: 3200 },
            ],
            byPlateType: [
              { label: 'Tứ quý', count: 150 },
            ],
          },
        }),
      });
    });

    await page.route('**/api/vpa/plates/counts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            all: 12500,
            vpa: 10000,
            monthly: 4000,
            weekly: 1000,
            expired: 5000,
            available: 2500,
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

    // Mock optimized shop plate summary endpoint
    await page.route('**/api/plates/summary**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 1250,
            available: 980,
            hot: 150,
          },
        }),
      });
    });

    // Mock Admin plates and VPA plates
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

    await page.route('**/api/admin/vpa/plates**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: '99999999-9999-9999-9999-999999999991',
                plateNumber: '30L-999.99',
                fullNumber: '30L-999.99',
                tab: 'Week',
                vehicle: 'Car',
                priceState: 2,
                startingPrice: 40000000,
                approvedPrice: 850000000,
                suggestedPrice: 800000000,
                isPinned: true,
                isHidden: false,
                provinceName: 'Hà Nội',
                plateTypeName: 'Ngũ quý',
              },
            ],
            total: 1000,
            page: 1,
            limit: 25,
          },
        }),
      });
    });

    // Mock export stats
    await page.route('**/api/admin/vpa/plates/export/provinces**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { provinceId: '11111111-1111-1111-1111-111111111111', provinceName: 'Hà Nội', vpaCount: 500, availableCount: 200, totalCount: 700 },
            { provinceId: '22222222-2222-2222-2222-222222222222', provinceName: 'TP. Hồ Chí Minh', vpaCount: 400, availableCount: 150, totalCount: 550 },
          ],
        }),
      });
    });
  });

  test('Benchmark 1: Admin Stats & VPA Navigation render fast with 0 lag', async ({ page }) => {
    // 1. Perform Admin Login
    const tLogin = Date.now();
    await page.goto('/dang-nhap');
    await page.getByLabel('Email hoặc số điện thoại').fill('admin@biensovip.com');
    await page.locator('input[type="password"]').first().fill('admin@123');
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    console.log(`[PERF BENCHMARK] Login submitted in ${Date.now() - tLogin}ms`);

    // 2. Navigate to Admin VPA Stats using sidebar
    const statsNav = page.getByRole('button', { name: 'Thống kê Biển số & VPA', exact: true });
    await expect(statsNav).toBeVisible({ timeout: 10000 });

    const tStatsStart = Date.now();
    await statsNav.click();

    // Verify stats header
    await expect(page.getByRole('heading', { name: 'Thống Kê & Báo Cáo Biển Số' })).toBeVisible({ timeout: 10000 });
    const statsRenderTime = Date.now() - tStatsStart;
    console.log(`[PERF BENCHMARK] Admin Thong ke Bien so & VPA render time: ${statsRenderTime}ms`);
    expect(statsRenderTime).toBeLessThan(4000);

    // Verify KPI numbers from optimized summary
    await expect(page.getByText('Kho biển số hệ thống', { exact: true })).toBeVisible();

    // 3. Switch sub-tab: Tab 2 (Thống kê Biển đấu giá VPA)
    const tSubTab = Date.now();
    const vpaTabBtn = page.getByRole('tab', { name: /2\. Thống kê Biển đấu giá VPA/i });
    if (await vpaTabBtn.isVisible()) {
      await vpaTabBtn.click();
      await page.waitForTimeout(300);
      const subTime = Date.now() - tSubTab;
      console.log(`[PERF BENCHMARK] Switch to VPA Stats tab duration: ${subTime}ms`);
      expect(subTime).toBeLessThan(1500);
    }

    // 4. Open Export Modal to test responsiveness
    const openExportBtn = page.getByRole('button', { name: 'Xuất dữ liệu biển số' });
    await expect(openExportBtn).toBeVisible();

    const tModalStart = Date.now();
    await openExportBtn.click();

    await expect(page.getByRole('heading', { name: 'Tùy chọn xuất dữ liệu biển số' })).toBeVisible();
    const modalOpenTime = Date.now() - tModalStart;
    console.log(`[PERF BENCHMARK] Open Export Modal time: ${modalOpenTime}ms`);
    expect(modalOpenTime).toBeLessThan(1500);

    // 5. Test switching to Motorbike option inside modal
    const tBike = Date.now();
    const bikeOption = page.getByTestId('vehicle-option-2');
    await expect(bikeOption).toBeVisible();
    await bikeOption.click();
    const bikeSwitchTime = Date.now() - tBike;
    console.log(`[PERF BENCHMARK] Switch vehicle option to Motorbike: ${bikeSwitchTime}ms`);
    expect(bikeSwitchTime).toBeLessThan(1000);
  });

  test('Benchmark 2: Admin Quản trị Biển VPA loads fast with lazy-loaded facets & direct counts', async ({ page }) => {
    // 1. Perform Admin Login
    await page.goto('/dang-nhap');
    await page.getByLabel('Email hoặc số điện thoại').fill('admin@biensovip.com');
    await page.locator('input[type="password"]').first().fill('admin@123');
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    // 2. Click button "Biển VPA" in sidebar
    const vpaNav = page.getByRole('button', { name: 'Biển VPA', exact: true });
    await expect(vpaNav).toBeVisible({ timeout: 10000 });

    const tStart = Date.now();
    await vpaNav.click();

    // Verify 5 tabs in Admin VPA appear
    const tabList = page.locator('.admin-tablist');
    await expect(tabList).toBeVisible({ timeout: 10000 });
    const loadTime = Date.now() - tStart;
    console.log(`[PERF BENCHMARK] Admin VPA Plate List load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);

    // Switch to tab "Duyệt giá"
    const tQueue = Date.now();
    await tabList.getByRole('tab', { name: /^Duyệt giá/ }).click();
    await expect(page).toHaveURL(/tab=queue/);
    const queueTime = Date.now() - tQueue;
    console.log(`[PERF BENCHMARK] Switch to Queue tab duration: ${queueTime}ms`);
    expect(queueTime).toBeLessThan(1500);
  });
});
