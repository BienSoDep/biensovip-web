import { test, expect } from '@playwright/test';

test.describe('LuckyPlate', () => {
  test('form submit produces fengshui result', async ({ page }) => {
    await page.goto('/#/tu-van');
    await expect(page.getByRole('heading', { name: 'Tìm biển số hợp mệnh của bạn' })).toBeVisible();
    await page.getByLabel('Ngày sinh').fill('1990-01-01');
    await page.getByRole('button', { name: 'Tra cứu mệnh của bạn' }).click();
    await expect(page.getByText(/Mệnh .+ —/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xem biển hợp mệnh →' })).toBeVisible();
  });

  test('tra cứu lại resets the form', async ({ page }) => {
    await page.goto('/#/tu-van');
    await page.getByLabel('Ngày sinh').fill('1990-01-01');
    await page.getByRole('button', { name: 'Tra cứu mệnh của bạn' }).click();
    await expect(page.getByText(/Mệnh .+ —/)).toBeVisible();
    await page.getByRole('button', { name: '← Tra cứu lại' }).click();
    await expect(page.getByRole('button', { name: 'Tra cứu mệnh của bạn' })).toBeVisible();
  });

  test('invalid date shows error', async ({ page }) => {
    await page.goto('/#/tu-van');
    await page.getByRole('button', { name: 'Tra cứu mệnh của bạn' }).click();
    await expect(page.getByText('Vui lòng nhập ngày sinh.')).toBeVisible();
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
