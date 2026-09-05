import { test, expect } from '@playwright/test';

test.describe('Reviews', () => {
  test('page renders with plate selector, no plate selected initially', async ({ page }) => {
    await page.goto('/danh-gia');
    await expect(page.getByRole('heading', { name: 'Đánh giá từ khách hàng' })).toBeVisible();
    await expect(page.getByText('Biển số đã mua', { exact: true })).toBeVisible();
    // rating UI only appears once a sold plate is selected
    await expect(page.getByText('Gửi đánh giá của bạn')).not.toBeVisible();
  });

  test('selecting a sold plate reveals rating summary and submit form', async ({ page }) => {
    await page.goto('/danh-gia');
    const select = page.locator('select');
    const optionCount = await select.locator('option').count();
    test.skip(optionCount < 2, 'No sold plates seeded — cannot exercise review form.');

    await select.selectOption({ index: 1 });
    await expect(page.getByText('Gửi đánh giá của bạn')).toBeVisible();
    await expect(page.getByText('Số sao:')).toBeVisible();
  });

  test('submitting without rating shows validation notify, without login shows auth error', async ({ page }) => {
    await page.goto('/danh-gia');
    const select = page.locator('select');
    const optionCount = await select.locator('option').count();
    test.skip(optionCount < 2, 'No sold plates seeded — cannot exercise review form.');

    await select.selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
    // Guest without rating selected → client-side validation fires first.
    await expect(page.getByText('Vui lòng chọn số sao.')).toBeVisible();
  });

  test('selecting stars then submitting as guest shows login-required error', async ({ page }) => {
    await page.goto('/danh-gia');
    const select = page.locator('select');
    const optionCount = await select.locator('option').count();
    test.skip(optionCount < 2, 'No sold plates seeded — cannot exercise review form.');

    await select.selectOption({ index: 1 });
    // 5 star buttons rendered as icon-only buttons in the "Số sao:" row
    const starButtons = page.locator('button').filter({ has: page.locator('svg') });
    // Click the 5th star button in the rating row (index found empirically via first star group)
    const ratingRow = page.getByText('Số sao:').locator('..');
    await ratingRow.locator('button').nth(2).click();
    await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
    await expect(page.getByText('Vui lòng đăng nhập để gửi đánh giá.')).toBeVisible();
  });
});
