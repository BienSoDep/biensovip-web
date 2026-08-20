import { test, expect } from '@playwright/test';

// Collaborator page (route #/cong-tac-vien) is still on the legacy in-memory
// mock state (st.collab in App.jsx) — not wired to a backend endpoint, so
// registration only persists for the current page session, not across reload.
test.describe('Collaborator registration', () => {
  test('shows registration form by default', async ({ page }) => {
    await page.goto('/#/cong-tac-vien');
    await expect(page.getByText('Đăng ký làm CTV')).toBeVisible();
    await expect(page.getByLabel('Họ tên')).toBeVisible();
    await expect(page.getByLabel('Số điện thoại')).toBeVisible();
  });

  test('validation errors show on empty submit', async ({ page }) => {
    await page.goto('/#/cong-tac-vien');
    await page.getByRole('button', { name: 'Đăng ký ngay' }).click();
    await expect(page.getByText('Vui lòng nhập họ tên.')).toBeVisible();
    await expect(page.getByText('Số điện thoại chưa đúng định dạng.')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập tên ngân hàng.')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập số tài khoản.')).toBeVisible();
  });

  test('successful registration shows CTV dashboard with referral link', async ({ page }) => {
    await page.goto('/#/cong-tac-vien');
    await page.getByLabel('Họ tên').fill('Nguyen Van CTV');
    await page.getByLabel('Số điện thoại').fill('0905221334');
    await page.getByLabel('Ngân hàng nhận hoa hồng').fill('Vietcombank');
    await page.getByLabel('Số tài khoản').fill('0123456789');
    await page.getByRole('button', { name: 'Đăng ký ngay' }).click();
    await expect(page.getByText('Đăng ký CTV thành công')).toBeVisible();
    await expect(page.getByText(/Xin chào, Nguyen Van CTV/)).toBeVisible();
    await expect(page.getByText('Link giới thiệu của bạn')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sao chép link' })).toBeVisible();
  });
});
