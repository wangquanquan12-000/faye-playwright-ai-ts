import { test, expect } from '@playwright/test';
import { dismissAgeGate } from '../src/helpers/auth';

test.describe('@flow 首页', () => {
  test('应正确加载 RM11 首页', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/RM11.*Private Fan Room/i);

    await dismissAgeGate(page);
    await expect(page.getByText('Sign up with Email', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('页面应包含 RM11 品牌信息', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await dismissAgeGate(page);

    const metaDescription = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(metaDescription).toContain('RM11');
  });
});
