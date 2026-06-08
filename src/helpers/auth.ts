import fs from 'fs';
import path from 'path';
import type { Page } from '@playwright/test';
import { testData } from '../fixtures/test-data';

/**
 * 登录/注册流程辅助函数。
 * 业务用例请使用 creatorTest fixture：每次执行前自动清缓存并重新登录。
 */

const CODE = testData.verificationCode;
const AUTH_DIR = path.join(process.cwd(), '.auth');

export function authStoragePath(role: string): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

export async function saveAuthStorage(page: Page, role: string): Promise<string> {
  const file = authStoragePath(role);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: file });
  return file;
}

/** 删除本地缓存的登录态文件 */
export function clearAuthStorage(role: string): void {
  const file = authStoragePath(role);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

/** 清除浏览器 cookies / storage，并重新确认 18+，确保从干净会话开始 */
export async function resetBrowserSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // 清空 storage 后重新打开首页，与 age-gate 用例保持同一加载路径
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await dismissAgeGate(page);
  await page
    .getByRole('button', { name: /^log in$/i })
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 });
}

export async function isLoggedInHome(page: Page): Promise<boolean> {
  return page
    .locator('nav')
    .getByText(/^(Home|Publish|Post)$/i)
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);
}

async function waitForHomeSidebar(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page
    .locator('nav')
    .getByText(/^(Home|Publish|Post)$/i)
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
}

export async function dismissAgeGate(page: Page): Promise<void> {
  const over18 = page.getByRole('button', { name: /over\s*18/i });
  for (let i = 0; i < 5; i++) {
    if (!(await over18.first().isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }
    await over18.first().click({ force: true });
    await page.waitForTimeout(1500);
  }
}

export async function dismissPushNotification(page: Page): Promise<void> {
  const allow = page.getByRole('button', { name: /^allow$/i });
  if (await allow.isVisible({ timeout: 3000 }).catch(() => false)) {
    await allow.click();
    await page.waitForTimeout(1000);
  }
}

async function clickEmailAuthEntry(page: Page, mode: 'login' | 'signup'): Promise<void> {
  const label = mode === 'login' ? 'Log in with Email' : 'Sign up with Email';
  await page.getByText(label, { exact: true }).first().locator('xpath=..').click({ force: true });
  await page.waitForTimeout(1000);
}

async function fillEmailAndSendCode(page: Page, email: string): Promise<void> {
  const emailInput = page
    .getByRole('textbox', { name: /email/i })
    .or(page.locator('input[placeholder="Email"]'));
  await emailInput.first().waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.first().fill(email);
  await page.getByRole('button', { name: /send code/i }).click();
  await page.waitForFunction(
    () => location.hash === '#step_3' || /verification code/i.test(document.body.innerText),
    { timeout: 20_000 }
  );
  await page.waitForTimeout(1000);
}

async function fillVerificationCode(page: Page, code: string = CODE): Promise<void> {
  const codeInputs = page.locator(
    'input[type="tel"], input[inputmode="numeric"], input[maxlength="1"]'
  );
  const count = await codeInputs.count();
  if (count >= 4) {
    for (let i = 0; i < 4; i++) await codeInputs.nth(i).fill(code[i]);
  } else {
    const textInputs = page.locator('input[type="text"]:visible');
    let filled = 0;
    for (let i = 0; i < (await textInputs.count()) && filled < 4; i++) {
      const ph = await textInputs.nth(i).getAttribute('placeholder');
      if (ph === 'Email') continue;
      await textInputs.nth(i).fill(code[filled]);
      filled++;
    }
  }
  await page.waitForTimeout(800);
}

async function clickNextWhenEnabled(page: Page): Promise<void> {
  await page.waitForTimeout(1000);
  const next = page.getByRole('button', { name: /^next$/i }).first();
  await next.waitFor({ state: 'visible', timeout: 30_000 });
  for (let i = 0; i < 80; i++) {
    if (!(await next.isDisabled().catch(() => true))) {
      await next.click();
      await page.waitForTimeout(2500);
      return;
    }
    await page.waitForTimeout(500);
  }
  throw new Error('Next 按钮未变为可点击状态');
}

async function completeOnboardingIfPresent(page: Page, username?: string): Promise<void> {
  for (let step = 0; step < 8; step++) {
    if (/\/home/.test(page.url())) break;

    const body = await page.locator('body').innerText();
    const lower = body.toLowerCase();

    if (/birthday|birth date|date of birth/.test(lower)) {
      const mm = page.locator('input[placeholder="MM"]');
      if (await mm.isVisible().catch(() => false)) {
        await mm.fill('06');
        await page.locator('input[placeholder="DD"]').fill('07');
        await page.locator('input[placeholder="YYYY"]').fill('1995');
      } else {
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible().catch(() => false)) {
          await dateInput.fill('1995-06-07');
        }
      }
    } else if (/username|user name|display name|what.?s your name|pick a name/.test(lower)) {
      const nameInput = page
        .locator('input[placeholder*="name" i], input[placeholder*="user" i]')
        .or(page.getByRole('textbox'))
        .first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(username || `viewer_${Date.now().toString().slice(-8)}`);
      }
    } else if (/avatar|profile picture|photo/.test(lower)) {
      const skip = page.getByRole('button', { name: /skip/i });
      if (await skip.isVisible().catch(() => false)) {
        await skip.click();
        await page.waitForTimeout(2000);
        continue;
      }
    } else if (/join as viewer|welcome to rm11/i.test(lower)) {
      const joinViewer = page.getByText('Join as Viewer', { exact: true });
      if (await joinViewer.isVisible().catch(() => false)) {
        await joinViewer.click();
        await page.waitForTimeout(2500);
        continue;
      }
    } else if (/viewer|fan|explore/.test(lower) && /creator|host|role|join as/.test(lower)) {
      const viewer = page.getByText(/join as viewer|^viewer$|^fan$/i).first();
      if (await viewer.isVisible().catch(() => false)) {
        await viewer.click();
        await page.waitForTimeout(1500);
        continue;
      }
    }

    const advanced = await page
      .getByRole('button', { name: /next|continue|confirm|done|save|submit|finish|get started|skip/i })
      .first();
    if (await advanced.isVisible().catch(() => false) && !(await advanced.isDisabled().catch(() => true))) {
      await advanced.click();
      await page.waitForTimeout(2000);
      continue;
    }

    if (/\/home/.test(page.url())) break;
    await page.waitForTimeout(1000);
  }
}

export async function openSignUpModal(page: Page): Promise<void> {
  await page.goto('/');
  await dismissAgeGate(page);

  const signUpEmail = page.getByText('Sign up with Email', { exact: true }).first();
  if (!(await signUpEmail.isVisible({ timeout: 3000 }).catch(() => false))) {
    const signUpBtn = page.getByRole('button', { name: /^sign up$/i }).first();
    if (await signUpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signUpBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
  }
  await signUpEmail.waitFor({ state: 'visible', timeout: 15_000 });
}

export async function openLoginModal(page: Page): Promise<void> {
  const loginEmail = page.getByText('Log in with Email', { exact: true }).first();

  if (!(await loginEmail.isVisible({ timeout: 2000 }).catch(() => false))) {
    const { pathname } = new URL(page.url());
    if (pathname !== '/') {
      await page.goto('/');
    }
    await dismissAgeGate(page);
    await page.waitForLoadState('domcontentloaded');
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    if (await loginEmail.isVisible({ timeout: 2000 }).catch(() => false)) break;

    await dismissAgeGate(page);
    const loginBtn = page.getByRole('button', { name: /^log in$/i }).first();
    await loginBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await loginBtn.scrollIntoViewIfNeeded();
    await loginBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await dismissAgeGate(page);
  }

  await dismissAgeGate(page);
  await loginEmail.waitFor({ state: 'visible', timeout: 15_000 });
}

export async function registerViewer(page: Page, email: string, username?: string): Promise<void> {
  await openSignUpModal(page);
  await clickEmailAuthEntry(page, 'signup');
  await fillEmailAndSendCode(page, email);
  await fillVerificationCode(page);
  await clickNextWhenEnabled(page);
  await completeOnboardingIfPresent(page, username);
  await page.waitForURL(/\/home/, { timeout: 60_000 });
  await dismissPushNotification(page);
}

export async function loginWithEmail(page: Page, email: string): Promise<void> {
  await openLoginModal(page);
  await clickEmailAuthEntry(page, 'login');
  await fillEmailAndSendCode(page, email);
  await fillVerificationCode(page);
  await clickNextWhenEnabled(page);
  await page.waitForURL(/\/home/, { timeout: 60_000 });
  await dismissPushNotification(page);
}

export async function loginAsCreator(page: Page): Promise<void> {
  await loginWithEmail(page, testData.creator.email);
}

/**
 * 确保 Creator 已登录并停留在首页。
 * 每次执行前强制清除缓存与会话，重新确认 18+ 并登录，获取新 token 供本次用例使用。
 */
export async function ensureCreatorAuthenticated(page: Page): Promise<void> {
  clearAuthStorage('creator');
  await resetBrowserSession(page);

  await loginAsCreator(page);
  await saveAuthStorage(page, 'creator');

  await page.goto('/home');
  await dismissAgeGate(page);
  await dismissPushNotification(page);
  await waitForHomeSidebar(page);
}

/** @deprecated 请使用 ensureCreatorAuthenticated */
export async function gotoAuthenticatedHome(page: Page): Promise<void> {
  await ensureCreatorAuthenticated(page);
}
