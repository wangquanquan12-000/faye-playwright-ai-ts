import { test, expect } from '@playwright/test';
import { loginAsCreator, resetBrowserSession } from '../../src/helpers/auth';
import { navPostButton } from '../../src/helpers/post';

test.describe('@flow AUTH-04 Creator 登录', () => {
  test('Creator Email 登录后应进入 Home 并显示发帖入口', async ({ page }) => {
    test.setTimeout(90_000);

    await resetBrowserSession(page);
    await loginAsCreator(page);

    await expect(page).toHaveURL(/\/home/);
    await expect(navPostButton(page)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('nav').getByText('Profile', { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });
});
