import { test, expect } from '@playwright/test';
import { authStoragePath, loginCreatorFresh } from '../../src/helpers/auth';
import fs from 'fs';

/**
 * 预生成 Creator 登录缓存 `.auth/creator.json`。
 * 首次跑 visual/flow 前可执行：npm run auth:seed
 * 强制重登：AUTH_REFRESH=1 npm run auth:seed
 */
test.describe.configure({ timeout: 180_000, retries: 0 });

test('seed creator storageState', async ({ browser }) => {
  const file = await loginCreatorFresh(browser);
  expect(fs.existsSync(file)).toBe(true);
  expect(file).toBe(authStoragePath('creator'));
  console.log(`Creator 登录态已写入: ${file}`);
});
