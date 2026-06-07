import { test, expect } from '@playwright/test';
import { loginAsCreator } from '../../src/helpers/auth';
import { testData } from '../../src/fixtures/test-data';
import { navPostButton } from '../../src/helpers/post';

test.describe('AUTH-04 Creator 登录', () => {
  test('Creator Email 登录后应进入 Home 并显示发帖入口', async ({ page }) => {
    test.setTimeout(90_000);

    await loginAsCreator(page);

    await expect(page).toHaveURL(/\/home/);
    await expect(navPostButton(page)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('body')).toContainText(testData.creator.username, { timeout: 15_000 });
  });
});
