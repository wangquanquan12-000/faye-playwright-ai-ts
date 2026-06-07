import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test('应正确加载 RM11 首页', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RM11.*Private Fan Room/i);
  });

  test('页面应包含 RM11 品牌信息', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const metaDescription = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(metaDescription).toContain('RM11');
  });
});
