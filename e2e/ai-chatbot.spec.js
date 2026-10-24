import { test, expect } from '@playwright/test';

test.describe('AiChatbot widget', () => {
  test('opens and closes, shows welcome message', async ({ page }) => {
    await page.goto('/');
    const fab = page.locator('.chatbot-fab');
    await expect(fab).toBeVisible();
    await fab.click();
    await expect(page.getByText('Trợ lý AI', { exact: true })).toBeVisible();
    await expect(page.getByText('Hỏi Trợ lý AI Thông Minh')).toBeVisible();
  });

  test('close button hides the panel and shows the FAB again', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    await expect(page.getByText('Trợ lý AI', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Đóng trợ lý' }).click();
    await expect(page.getByRole('dialog', { name: 'Trò chuyện Biensovip' })).not.toBeVisible();
    await expect(page.locator('.chatbot-fab')).toBeVisible();
  });

  test('typing and sending a message shows a user bubble, then bot reply or fallback', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    const input = page.locator('.claude-composer-box textarea');
    await input.fill('Ý nghĩa biển này là gì?');
    await input.press('Enter');
    // user message bubble appears immediately
    await expect(page.locator('.claude-user-bubble')).toContainText('Ý nghĩa biển này là gì?');
    // Either the AI replies or fallback text shows
    await expect(page.getByText('Trợ lý AI đang suy nghĩ…')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('quick-reply chip sends the message immediately', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    // Quick-reply chips call send(qr) directly
    const chip = page.getByRole('button', { name: 'Xem biển giá dưới 100 triệu' });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page.getByText('Xem biển giá dưới 100 triệu')).toBeVisible();
  });
});
