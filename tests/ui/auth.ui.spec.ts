import { test, expect } from '@playwright/test';
import { dismissAgeGate } from '../../src/helpers/auth';
import { inspectAgeGateUi, inspectLandingAuthUi } from '../../src/helpers/ui-design';

test.describe('@visual 认证页面视觉', () => {
  test('UI-AGE-01 18+ 弹窗', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByText(/adults only/i)).toBeVisible({ timeout: 10_000 });
    await inspectAgeGateUi(page, testInfo);
  });

  test('UI-AGE-02 落地页注册区', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissAgeGate(page);
    await expect(page.getByText('Sign up with Email', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await inspectLandingAuthUi(page, testInfo);
  });
});
