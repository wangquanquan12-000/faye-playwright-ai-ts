import fs from 'fs';
import { test, expect } from '@playwright/test';
import { authStoragePath, registerViewer, saveAuthStorage } from '../../src/helpers/auth';
import { generateViewerEmail } from '../../src/fixtures/test-data';

let registeredViewerEmail = '';
const viewerSessionFile = authStoragePath('viewer-session');

test.describe.serial('Viewer 登录注册', () => {
  test('AUTH-02 Viewer Email 注册主流程', async ({ page }) => {
    test.setTimeout(120_000);
    if (fs.existsSync(viewerSessionFile)) fs.unlinkSync(viewerSessionFile);

    registeredViewerEmail = generateViewerEmail();
    await registerViewer(page, registeredViewerEmail);
    await saveAuthStorage(page, 'viewer-session');

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('nav').getByText('Home', { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test.describe(() => {
    test.use({ storageState: viewerSessionFile });

    test('AUTH-03 Viewer 登录态校验（复用注册会话，无需再次发验证码）', async ({ page }) => {
      test.setTimeout(60_000);
      expect(registeredViewerEmail).toBeTruthy();

      await page.goto('/home');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/home/);
      await expect(page).toHaveTitle(/RM11/i);
      await expect(page.locator('nav').getByText('Profile', { exact: true })).toBeVisible({ timeout: 15_000 });
    });
  });
});
