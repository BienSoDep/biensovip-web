import { test, expect } from '@playwright/test';

test.describe('VPA Emergency Contact Price Toggles (Car & Motorbike)', () => {
  test('Admin can view and toggle force price contact independently for car and motorbike', async ({ page }) => {
    // 1. Mock authentication
    await page.route('**/api/auth/login', route =>
      route.fulfill({ status: 401, json: { message: 'Not a regular user' } })
    );

    await page.route('**/api/admin/auth/login', route =>
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

    // Mock initial settings
    let currentSettings = {
      officialEnabled: true,
      officialIntervalMinutes: 60,
      publishedEnabled: true,
      publishedIntervalMinutes: 60,
      resultsEnabled: true,
      resultsIntervalMinutes: 60,
      windowMonths: 3,
      minSamples: 3,
      factor: 1.2,
      includeFloorPrice: false,
      driftPercent: 10,
      roundStep: 500000,
      minDelayMs: 500,
      maxDelayMs: 2000,
      timeoutSeconds: 30,
      maxRetries: 3,
      suddenDropPercent: 30,
      resultsFullEveryDays: 7,
      alertCooldownMinutes: 120,
      publishedWindowStartHour: 6,
      publishedWindowEndHour: 22,
      officialWindowStartHour: 6,
      officialWindowEndHour: 22,
      resultsWindowStartHour: 6,
      resultsWindowEndHour: 22,
      forcePriceContact: false,
      forcePriceContactCar: false,
      forcePriceContactMotorbike: false,
    };

    let lastSavedPayload = null;

    await page.route('**/api/admin/vpa/overview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            settings: currentSettings,
            running: [],
            recentRuns: [],
            sources: [],
            alerts: [],
          },
        }),
      });
    });

    await page.route('**/api/admin/vpa/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: currentSettings }),
        });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        lastSavedPayload = body;
        currentSettings = { ...currentSettings, ...body };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: currentSettings }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock other required VPA admin endpoints so page loads cleanly
    await page.route('**/api/admin/vpa/stats**', route =>
      route.fulfill({ status: 200, json: { success: true, data: { totalPlates: 100, publishedPlates: 50 } } })
    );
    await page.route('**/api/admin/vpa/runs**', route =>
      route.fulfill({ status: 200, json: { success: true, data: [] } })
    );
    await page.route('**/api/admin/vpa/alerts**', route =>
      route.fulfill({ status: 200, json: { success: true, data: [] } })
    );
    await page.route('**/api/admin/vpa/plates**', route =>
      route.fulfill({ status: 200, json: { success: true, data: { items: [], total: 0 } } })
    );
    await page.route('**/api/admin/notifications**', route =>
      route.fulfill({ status: 200, json: { success: true, data: { items: [], unreadCount: 0 } } })
    );

    // 2. Perform Admin Login
    await page.goto('/dang-nhap');
    await page.getByLabel('Email hoặc số điện thoại').fill('admin@biensovip.com');
    await page.locator('input[type="password"]').first().fill('admin@123');
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    // 3. Navigate to VPA Admin page -> Tab Đồng bộ & cấu hình
    const vpaNav = page.getByRole('button', { name: 'Biển VPA', exact: true });
    await expect(vpaNav).toBeVisible({ timeout: 10000 });
    await vpaNav.click();

    const overviewTab = page.getByRole('tab', { name: /Đồng bộ & cấu hình/i });
    await expect(overviewTab).toBeVisible({ timeout: 5000 });
    await overviewTab.click();

    // 4. Verify the Emergency Section UI
    await expect(page.getByText(/Chế độ khẩn cấp: Hiển thị "Giá liên hệ" cho biển VPA/i)).toBeVisible();
    await expect(page.getByText('Đang hiển thị giá niêm yết chuẩn')).toBeVisible();

    // Verify dual vehicle panels
    await expect(page.getByText('Biển VPA Ô tô')).toBeVisible();
    await expect(page.getByText('Biển VPA Xe máy')).toBeVisible();

    // 5. Test Quick Action: "Bật cả 2 (Ô tô & Xe máy)"
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const bothBtn = page.getByRole('button', { name: /Bật cả 2 \(Ô tô & Xe máy\)/i });
    await expect(bothBtn).toBeVisible();
    await bothBtn.click();

    // Verify badge updates to BOTH
    await expect(page.getByText('ĐANG KÍCH HOẠT (CẢ Ô TÔ & XE MÁY)')).toBeVisible({ timeout: 5000 });
    expect(lastSavedPayload).not.toBeNull();
    expect(lastSavedPayload.forcePriceContact).toBe(true);
    expect(lastSavedPayload.forcePriceContactCar).toBe(true);
    expect(lastSavedPayload.forcePriceContactMotorbike).toBe(true);

    // 6. Test Quick Action: "Khôi phục tất cả về giá chuẩn"
    const restoreBtn = page.getByRole('button', { name: /Khôi phục tất cả về giá chuẩn/i });
    await expect(restoreBtn).toBeVisible();
    await restoreBtn.click();

    await expect(page.getByText('Đang hiển thị giá niêm yết chuẩn')).toBeVisible({ timeout: 5000 });
    expect(lastSavedPayload.forcePriceContact).toBe(false);
    expect(lastSavedPayload.forcePriceContactCar).toBe(false);
    expect(lastSavedPayload.forcePriceContactMotorbike).toBe(false);

    // 7. Test Toggling Car Only
    const carSwitch = page.getByTitle('Chuyển đổi hiển thị biển số Ô tô nguồn VPA sang \'Giá liên hệ\'').getByRole('switch');
    await carSwitch.click();

    await expect(page.getByText('ĐANG KÍCH HOẠT (CHỈ Ô TÔ)')).toBeVisible({ timeout: 5000 });
    expect(lastSavedPayload.forcePriceContactCar).toBe(true);
    expect(lastSavedPayload.forcePriceContactMotorbike).toBe(false);
    expect(lastSavedPayload.forcePriceContact).toBe(false);

    // 8. Test Toggling Motorbike As Well (Now both are on)
    const bikeSwitch = page.getByTitle('Chuyển đổi hiển thị biển số Xe máy nguồn VPA sang \'Giá liên hệ\'').getByRole('switch');
    await bikeSwitch.click();

    await expect(page.getByText('ĐANG KÍCH HOẠT (CẢ Ô TÔ & XE MÁY)')).toBeVisible({ timeout: 5000 });
    expect(lastSavedPayload.forcePriceContactCar).toBe(true);
    expect(lastSavedPayload.forcePriceContactMotorbike).toBe(true);
    expect(lastSavedPayload.forcePriceContact).toBe(true);

    // 9. Turn off Car (Now only Motorbike is on)
    await carSwitch.click();

    await expect(page.getByText('ĐANG KÍCH HOẠT (CHỈ XE MÁY)')).toBeVisible({ timeout: 5000 });
    expect(lastSavedPayload.forcePriceContactCar).toBe(false);
    expect(lastSavedPayload.forcePriceContactMotorbike).toBe(true);
    expect(lastSavedPayload.forcePriceContact).toBe(false);
  });
});
