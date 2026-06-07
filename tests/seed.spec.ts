import { test, expect } from '@playwright/test';

/**
 * Seed test — Playwright AI Agents 的入口。
 * Planner / Generator / Healer 会基于此文件了解项目环境与基础导航能力。
 * @see https://playwright.dev/docs/test-agents
 */
test.describe('RM11 Test Environment', () => {
  test('seed - homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RM11/i);
  });

  test('seed - explore main navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const snapshot = await page.locator('body').ariaSnapshot();
    expect(snapshot.length).toBeGreaterThan(0);
  });
});
