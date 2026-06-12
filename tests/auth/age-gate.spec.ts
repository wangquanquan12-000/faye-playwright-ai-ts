import { test, expect } from '@playwright/test';
import { dismissAgeGate } from '../../src/helpers/auth';

test.describe('@flow AUTH-01 年龄确认', () => {
  test('访问首页应通过 18+ 弹窗并看到注册入口', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/adults only/i)).toBeVisible({ timeout: 10_000 });

    await dismissAgeGate(page);
    await expect(page.getByText('Sign up with Email', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^log in$/i })).toBeVisible();
  });
});
