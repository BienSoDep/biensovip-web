import { test, expect } from '@playwright/test';

test.describe('Terms', () => {
  test('renders title and all sections', async ({ page }) => {
    await page.goto('/dieu-khoan');
    await expect(page.getByRole('heading', { name: 'Điều khoản sử dụng' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '1. Giới thiệu' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '4. Giao dịch' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '8. Liên hệ' })).toBeVisible();
    await expect(page.getByText(/duymc64@gmail\.com|lienhe@biensovip\.com/).first()).toBeVisible();
  });
});

test.describe('Privacy', () => {
  test('renders title and all sections including list items', async ({ page }) => {
    await page.goto('/bao-mat');
    await expect(page.getByRole('heading', { name: 'Chính sách bảo mật' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '1. Thông tin chúng tôi thu thập' })).toBeVisible();
    await expect(page.getByText(/Cookie/)).toBeVisible();
    await expect(page.getByRole('heading', { name: '5. Quyền của bạn' })).toBeVisible();
    await expect(page.getByText('Yêu cầu xóa tài khoản.')).toBeVisible();
  });
});

test.describe('TransferGuide', () => {
  test('renders 4 steps and notes', async ({ page }) => {
    await page.goto('/sang-ten');
    await expect(page.getByRole('heading', { name: /Hướng dẫn.*sang tên/ })).toBeVisible();
    await expect(page.getByText(/1\.\s*Thẩm định/)).toBeVisible();
    await expect(page.getByText(/4\.\s*Đăng ký/)).toBeVisible();
    await expect(page.getByText(/Lưu ý.*quan trọng/)).toBeVisible();
  });

  test('CTA buttons navigate / open zalo', async ({ page }) => {
    await page.goto('/sang-ten');
    await page.getByRole('button', { name: 'Xem kho biển số' }).click();
    await expect(page.getByRole('heading', { name: 'Kho biển số đẹp' })).toBeVisible();
  });
});

test.describe('Faq', () => {
  test('renders questions and expands answer on click', async ({ page }) => {
    await page.goto('/hoi-dap');
    await expect(page.getByRole('heading', { name: 'Câu hỏi thường gặp' })).toBeVisible();
    const firstQuestion = page.getByText('Biển số đẹp có sang tên được không?');
    await expect(firstQuestion).toBeVisible();
    // answer collapsed initially
    await expect(page.getByText(/Thông tư 24\/2023\/TT-BCA/)).not.toBeVisible();
    await firstQuestion.click();
    await expect(page.getByText(/Thông tư 24\/2023\/TT-BCA/)).toBeVisible();
    // click again to collapse
    await firstQuestion.click();
    await expect(page.getByText(/Thông tư 24\/2023\/TT-BCA/)).not.toBeVisible();
  });

  test('not-found CTA navigates to contact page', async ({ page }) => {
    await page.goto('/hoi-dap');
    await expect(page.getByText('Chưa tìm thấy câu trả lời?')).toBeVisible();
    await page.getByRole('button', { name: 'Gửi yêu cầu tư vấn' }).click();
    await expect(page.getByRole('heading', { name: 'Liên hệ tư vấn' })).toBeVisible();
  });
});
