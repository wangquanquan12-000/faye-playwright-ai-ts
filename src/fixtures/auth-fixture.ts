import fs from 'fs';
import path from 'path';
import { test as base, type Browser } from '@playwright/test';
import {
  authStoragePath,
  clearAuthStorage,
  dismissAgeGate,
  dismissPushNotification,
  ensureCreatorAuthenticated,
  loginWithEmail,
  resetBrowserSession,
  saveAuthStorage,
} from '../helpers/auth';
import { testData } from './test-data';

/** 手动 newContext 时需显式传入 baseURL，否则 page.goto('/') 无法解析 */
function createAuthContext(browser: Browser) {
  return browser.newContext({ baseURL: testData.baseURL });
}

export { authStoragePath, clearAuthStorage, saveAuthStorage };

async function loginViewerFresh(browser: Browser, email: string): Promise<string> {
  const safeName = email.replace(/[^a-zA-Z0-9]/g, '_');
  const file = authStoragePath(`viewer-${safeName}`);
  clearAuthStorage(`viewer-${safeName}`);

  const context = await createAuthContext(browser);
  const page = await context.newPage();
  await resetBrowserSession(page);
  await loginWithEmail(page, email);
  await page.goto('/home');
  await dismissAgeGate(page);
  await dismissPushNotification(page);
  await context.storageState({ path: file });
  await context.close();
  return file;
}

/**
 * Creator 业务测试 — 每次执行用例前清除缓存，重新确认 18+ 并登录，获取新 token。
 * 同一条用例内的 test.step 共享本次登录会话，不会重复登录。
 *
 * @example
 * import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';
 * test('Post 主流程', async ({ page }) => { ... });
 */
export const creatorTest = base.extend({
  page: async ({ page }, use) => {
    await ensureCreatorAuthenticated(page);
    await use(page);
  },
});

/**
 * 指定 Viewer 邮箱的已登录测试 — worker 内登录一次。
 */
export function createViewerTest(email: string) {
  return base.extend<{}, { workerViewerStorage: string }>({
    storageState: ({ workerViewerStorage }, use) => use(workerViewerStorage),

    workerViewerStorage: [
      async ({ browser }, use) => {
        const file = await loginViewerFresh(browser, email);
        await use(file);
      },
      { scope: 'worker' },
    ],
  });
}

export { expect } from '@playwright/test';
export { testData };
export { ensureCreatorAuthenticated } from '../helpers/auth';
