import fs from 'fs';
import path from 'path';
import { test as base, type Browser } from '@playwright/test';
import {
  authStoragePath,
  clearAuthStorage,
  dismissAgeGate,
  dismissPushNotification,
  ensureCreatorSession,
  loginCreatorFresh,
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

/** Worker 首次登录含发码冷却，需长于默认 test timeout */
const WORKER_LOGIN_TIMEOUT_MS = 180_000;

async function resolveCreatorStorage(browser: Browser): Promise<string> {
  const file = authStoragePath('creator');
  if (process.env.AUTH_REFRESH === '1' || !fs.existsSync(file)) {
    console.log('Creator 登录态未缓存，worker 内执行首次登录…');
    return loginCreatorFresh(browser);
  }
  console.log(`复用 Creator 登录态: ${file}`);
  return file;
}

/**
 * Creator 业务测试 — worker 内登录一次，复用 `.auth/creator.json`。
 * 同 worker 后续用例不再重复发验证码；token 过期时 ensureCreatorSession 自动重登。
 *
 * 强制重新登录：AUTH_REFRESH=1 npm run test ...
 *
 * @example
 * import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';
 * test('Post 主流程', async ({ page }) => { ... });
 */
export const creatorTest = base.extend<{}, { workerCreatorStorage: string }>({
  storageState: ({ workerCreatorStorage }, use) => use(workerCreatorStorage),

  workerCreatorStorage: [
    async ({ browser }, use) => {
      const file = await resolveCreatorStorage(browser);
      await use(file);
    },
    { scope: 'worker', timeout: WORKER_LOGIN_TIMEOUT_MS },
  ],

  page: async ({ page }, use) => {
    await ensureCreatorSession(page);
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
      { scope: 'worker', timeout: WORKER_LOGIN_TIMEOUT_MS },
    ],
  });
}

export { expect } from '@playwright/test';
export { testData };
export { ensureCreatorSession } from '../helpers/auth';
