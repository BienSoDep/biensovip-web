import { test, expect } from '@playwright/test';

// Ngày sinh dùng 3 ô rời (ngày/tháng/năm placeholder, không có label riêng từng ô) —
// khác với 1 field text đơn như test cũ giả định.
async function fillBirthDate(page, day, month, year) {
  await page.getByPlaceholder('ngày').fill(day);
  await page.getByPlaceholder('tháng').fill(month);
  await page.getByPlaceholder('năm').fill(year);
}

const mockFengshuiResult = {
  element: 'Thổ',
  elementLabel: 'Lộ Bàng Thổ',
  birthYear: 1990,
  luckyDigits: [0, 2, 5, 8],
  avoidDigits: [3, 4],
  disclaimer: 'Kết quả mang tính tham khảo phong thuỷ dân gian.',
  ranked: [
    {
      plateId: 1,
      plateNumber: '43A-888.88',
      price: 200000000,
      status: 'available',
      province: 'Đà Nẵng',
      score: 95,
      explain: ['Ngũ hành tương sinh', 'Số 8 hợp mệnh Thổ'],
      source: 'own',
    },
  ],
};

test.describe('LuckyPlate', () => {
  test('form submit produces fengshui result', async ({ page }) => {
    await page.route('**/api/fengshui/lookup', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockFengshuiResult }),
      })
    );
    await page.goto('/hop-menh');
    await expect(page.getByRole('heading', { name: 'Tìm biển số hợp mệnh của bạn' })).toBeVisible();
    await fillBirthDate(page, '15', '05', '1990');
    await page.getByRole('button', { name: 'Tra cứu mệnh của bạn' }).click();
    await expect(page.getByRole('heading', { name: 'Top biển hợp mệnh bạn' })).toBeVisible();
  });

  test('tra cứu lại resets the form', async ({ page }) => {
    await page.route('**/api/fengshui/lookup', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockFengshuiResult }),
      })
    );
    await page.goto('/hop-menh');
    await fillBirthDate(page, '15', '05', '1990');
    await page.getByRole('button', { name: 'Tra cứu mệnh của bạn' }).click();
    await expect(page.getByRole('heading', { name: 'Top biển hợp mệnh bạn' })).toBeVisible();
    await page.getByRole('button', { name: /Sửa thông tin/ }).click();
    await expect(page.getByRole('button', { name: 'Tra cứu mệnh của bạn' })).toBeVisible();
  });

  test('invalid date shows error', async ({ page }) => {
    await page.goto('/hop-menh');
    await page.getByRole('button', { name: 'Tra cứu mệnh của bạn' }).click();
    await expect(page.getByText(/Vui lòng nhập ngày sinh|Ngày sinh không hợp lệ/)).toBeVisible();
  });
});

test.describe('About', () => {
  test('renders all sections and CTA navigates to list', async ({ page }) => {
    await page.goto('/gioi-thieu');
    await expect(page.getByRole('heading', { name: /Chọn số như chọn vận khí/i })).toBeVisible();
    await expect(page.getByText(/Dấu Ấn Làm Nghề|Hành trình làm nghề/)).toBeVisible();
    await expect(page.getByText(/Giá Trị Cốt Lõi|Giá trị tôi giữ vững/)).toBeVisible();
    await expect(page.getByText(/Bảo Chứng Pháp Lý|Quy trình mua/i)).toBeVisible();
    await expect(page.getByText(/Tại Sao Khách Hàng Chọn|Khách hàng nói về tôi/)).toBeVisible();
    await page.getByRole('button', { name: /Khám phá kho biển số|Xem kho biển số/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });
});
