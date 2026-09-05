import { test, expect } from '@playwright/test';

test.describe('AiChatbot widget', () => {
  test('opens and closes, shows welcome message', async ({ page }) => {
    await page.goto('/');
    const fab = page.locator('.chatbot-fab');
    await expect(fab).toBeVisible();
    await fab.click();
    await expect(page.getByText('Trợ lý Biensovip', { exact: true })).toBeVisible();
    await expect(page.getByText('Chào bạn! Tôi là trợ lý Biensovip.')).toBeVisible();
  });

  test('close button hides the panel and shows the FAB again', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    await expect(page.getByText('Trợ lý Biensovip', { exact: true })).toBeVisible();
    // close (X) button: no aria-label, but it's the only <button> in the
    // header bar that wraps the "Trợ lý Biensovip" title.
    await page.getByText('Trợ lý Biensovip', { exact: true }).locator('xpath=ancestor::div[button][1]//button').click();
    await expect(page.getByText('Trợ lý Biensovip', { exact: true })).not.toBeVisible();
    await expect(page.locator('.chatbot-fab')).toBeVisible();
  });

  test('typing and sending a message shows a user bubble, then bot reply or fallback', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    const input = page.getByPlaceholder('Nhập câu hỏi...');
    await input.fill('Ý nghĩa biển này là gì?');
    await input.press('Enter');
    // user message bubble appears immediately
    await expect(page.getByText('Ý nghĩa biển này là gì?')).toBeVisible();
    // Either the AI replies (if DeepSeek key configured) or the fallback text
    // shows — we only assert *some* bot response arrives, not its content.
    await expect(page.getByText('Đang trả lời…')).toBeVisible();
    await expect(page.getByText('Đang trả lời…')).not.toBeVisible({ timeout: 15000 });
  });

  test('quick-reply chip sends the message immediately', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    // Quick-reply chips call send(qr) directly (not fill-then-wait-for-submit) —
    // clicking one posts the message right away as a user bubble.
    await page.getByRole('button', { name: 'Còn hàng không?' }).click();
    await expect(page.getByText('Còn hàng không?')).toBeVisible();
    await expect(page.getByPlaceholder('Nhập câu hỏi...')).toHaveValue('');
  });
});
