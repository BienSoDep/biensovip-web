import { test, expect } from '@playwright/test';

// Extra Auth.jsx validation edge cases beyond the empty-submit case already
// covered in auth.spec.js. Client-side rules (App.jsx authSubmit):
//   register: name required, email must include "@", password >= 8 chars, must agree to terms
//   login: identifier required, password >= 8 chars (length-only check, no complexity rule)
test.describe('Auth validation edge cases', () => {
  test('register: invalid email format (no @) shows format error', async ({ page }) => {
    await page.goto('/#/dang-ky');
    await page.getByLabel('Họ và tên').fill('Nguyen Van A');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Mật khẩu').fill('matkhau123');
    await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Email chưa đúng định dạng.')).toBeVisible();
  });

  test('register: password under 8 chars is rejected', async ({ page }) => {
    await page.goto('/#/dang-ky');
    await page.getByLabel('Họ và tên').fill('Nguyen Van A');
    await page.getByLabel('Email').fill(`shortpw${Date.now()}@example.com`);
    await page.getByLabel('Mật khẩu').fill('abc123');
    await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Mật khẩu tối thiểu 8 ký tự.')).toBeVisible();
  });

  test('register: unchecked terms checkbox blocks submit', async ({ page }) => {
    await page.goto('/#/dang-ky');
    await page.getByLabel('Họ và tên').fill('Nguyen Van A');
    await page.getByLabel('Email').fill(`noagree${Date.now()}@example.com`);
    await page.getByLabel('Mật khẩu').fill('matkhau123');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Bạn cần đồng ý với điều khoản để tiếp tục.')).toBeVisible();
  });

  test('register: duplicate email shows "already used" error', async ({ page }) => {
    const email = `dup${Date.now()}@example.com`;
    await page.goto('/#/dang-ky');
    await page.getByLabel('Họ và tên').fill('First User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu').fill('matkhau123');
    await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')).toBeVisible();

    await page.goto('/#/dang-ky');
    await page.getByLabel('Họ và tên').fill('Second User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu').fill('matkhau123');
    await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Email đã được sử dụng.')).toBeVisible();
  });

  test('login: short password fails client-side length check before hitting the server', async ({ page }) => {
    await page.goto('/#/dang-nhap');
    await page.getByLabel('Email hoặc số điện thoại').fill('someone@example.com');
    await page.getByLabel('Mật khẩu').fill('abc');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByText('Mật khẩu tối thiểu 8 ký tự.')).toBeVisible();
  });

  test('login: wrong credentials shows generic auth error', async ({ page }) => {
    await page.goto('/#/dang-nhap');
    await page.getByLabel('Email hoặc số điện thoại').fill('doesnotexist@example.com');
    await page.getByLabel('Mật khẩu').fill('wrongpassword1');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByText('Thông tin đăng nhập không đúng.')).toBeVisible();
  });

  test('admin login: password under 6 chars is rejected client-side', async ({ page }) => {
    await page.goto('/#/admin');
    await page.getByLabel('Tài khoản').fill('admin@biensovip.com');
    await page.getByLabel('Mật khẩu').fill('abc');
    await page.getByRole('button', { name: 'Đăng nhập quản trị' }).click();
    await expect(page.getByText('Mật khẩu tối thiểu 6 ký tự.')).toBeVisible();
  });

  test('admin login: wrong password shows error', async ({ page }) => {
    await page.goto('/#/admin');
    await page.getByLabel('Tài khoản').fill('admin@biensovip.com');
    await page.getByLabel('Mật khẩu').fill('wrongpassword');
    await page.getByRole('button', { name: 'Đăng nhập quản trị' }).click();
    await expect(page.getByText('Email hoặc mật khẩu không đúng.')).toBeVisible();
  });
});
