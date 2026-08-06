import { test, expect } from '@playwright/test';

test.describe('LuckyPlate', () => {
  test('form submit produces ranked results', async ({ page }) => {
    await page.goto('/#/tu-van');
    await expect(page.getByRole('heading', { name: 'Tìm biển số hợp mệnh của bạn' })).toBeVisible();
    await page.getByLabel('Năm sinh').fill('1990');
    await page.getByRole('button', { name: 'Gợi ý biển số hợp mệnh' }).click();
    await expect(page.getByText('3 biển số hợp mệnh nhất')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xem biển' })).toHaveCount(3);
  });

  test('sửa thông tin resets the form', async ({ page }) => {
    await page.goto('/#/tu-van');
    await page.getByLabel('Năm sinh').fill('1990');
    await page.getByRole('button', { name: 'Gợi ý biển số hợp mệnh' }).click();
    await expect(page.getByText('3 biển số hợp mệnh nhất')).toBeVisible();
    await page.getByRole('button', { name: '← Sửa thông tin' }).click();
    await expect(page.getByRole('button', { name: 'Gợi ý biển số hợp mệnh' })).toBeVisible();
  });

  test('invalid year shows error', async ({ page }) => {
    await page.goto('/#/tu-van');
    await page.getByLabel('Năm sinh').fill('abcd');
    await page.getByRole('button', { name: 'Gợi ý biển số hợp mệnh' }).click();
    await expect(page.getByText('Nhập năm sinh hợp lệ (VD: 1990).')).toBeVisible();
  });
});

test.describe('About', () => {
  test('renders all sections and CTA navigates to list', async ({ page }) => {
    await page.goto('/#/gioi-thieu');
    await expect(page.getByRole('heading', { name: /Chọn số như chọn vận khí/ })).toBeVisible();
    await expect(page.getByText('Hành trình làm nghề')).toBeVisible();
    await expect(page.getByText('Giá trị tôi giữ vững')).toBeVisible();
    await expect(page.getByText('Quy trình mua — 4 bước')).toBeVisible();
    await expect(page.getByText('Khách hàng nói về tôi')).toBeVisible();
    await expect(page.getByText('Câu hỏi thường gặp')).toBeVisible();
    await page.getByRole('button', { name: 'Xem kho biển số' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });
});
