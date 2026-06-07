import { test, expect } from '@playwright/test';
import { loginWithEmail, registerViewer } from '../../src/helpers/auth';
import { generateViewerEmail } from '../../src/fixtures/test-data';

let registeredViewerEmail = '';

test.describe.serial('Viewer 登录注册', () => {
  test('AUTH-02 Viewer Email 注册主流程', async ({ page }) => {
    test.setTimeout(120_000);
    registeredViewerEmail = generateViewerEmail();

    await registerViewer(page, registeredViewerEmail);

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('nav').getByText('Home', { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('AUTH-03 Viewer Email 登录主流程', async ({ page }) => {
    test.setTimeout(90_000);
    expect(registeredViewerEmail).toBeTruthy();

    await loginWithEmail(page, registeredViewerEmail);

    await expect(page).toHaveURL(/\/home/);
    await expect(page).toHaveTitle(/RM11/i);
    await expect(page.locator('nav').getByText('Profile', { exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
