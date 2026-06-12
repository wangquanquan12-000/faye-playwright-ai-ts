import fs from 'fs';
import path from 'path';
import type { Browser, Locator, Page } from '@playwright/test';
import { testData } from '../fixtures/test-data';

/**
 * 登录/注册辅助函数。
 *
 * 默认规则（业务/UI 用例）：
 * - 使用 creatorTest fixture + `.auth/creator.json` 复用登录态
 * - 仅在 token 过期（访问 /home 未登录）时自动重新登录
 * - 不要每条用例 clearAuthStorage + 重新发验证码
 *
 * 仅 @flow 登录/注册专用用例应显式调用 resetBrowserSession + loginWithEmail/registerViewer
 */

const CODE = testData.verificationCode;
const AUTH_DIR = path.join(process.cwd(), '.auth');
const CREATOR_ROLE = 'creator';

export function authStoragePath(role: string): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

export async function saveAuthStorage(page: Page, role: string): Promise<string> {
  const file = authStoragePath(role);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: file });
  return file;
}

/** 删除本地缓存的登录态文件（仅 AUTH_REFRESH 或显式登录用例使用） */
export function clearAuthStorage(role: string): void {
  const file = authStoragePath(role);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

/** 清除浏览器 cookies / storage，并重新确认 18+（仅登录/注册用例或 worker 首次登录） */
export async function resetBrowserSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await dismissAgeGate(page);
  await page
    .getByRole('button', { name: /^log in$/i })
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 });
}

/** 主站导航：Desktop 侧栏 / Mobile 底部 Tab（均含 /home 入口） */
export function appNavigation(page: Page): Locator {
  return page
    .locator('nav')
    .filter({ has: page.locator('a[href="/home"], a[href^="/home?"]') })
    .or(
      page
        .getByRole('navigation')
        .filter({ has: page.locator('a[href="/home"], a[href^="/home?"]') })
    )
    .first();
}

export async function isLoggedInHome(page: Page): Promise<boolean> {
  const nav = appNavigation(page);
  const labelled = nav.getByText(/^(Home|Publish|Post)$/i).first();
  if (await labelled.isVisible({ timeout: 3000 }).catch(() => false)) {
    return true;
  }
  // Mobile：图标导航，通过 /home 链接判断已登录首页
  return nav
    .locator('a[href="/home"], a[href^="/home?"]')
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
}

async function waitForHomeSidebar(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  const nav = appNavigation(page);
  const labelled = nav.getByText(/^(Home|Publish|Post)$/i).first();
  if (await labelled.isVisible({ timeout: 5000 }).catch(() => false)) {
    await labelled.waitFor({ state: 'visible', timeout: 30_000 });
    return;
  }
  await nav
    .locator('a[href="/home"], a[href^="/home?"]')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
}

export async function dismissAgeGate(page: Page): Promise<void> {
  const over18 = page.getByRole('button', { name: /(over\s*18|yes,?\s*i'?m\s*18\+)/i });
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
  const entry = page
    .getByText(label, { exact: true })
    .or(mode === 'login' ? page.getByText('Sign up with Email', { exact: true }) : page.getByText(label, { exact: true }))
    .first();
  await entry.click({ force: true }).catch(async () => {
    await entry.locator('xpath=..').click({ force: true });
  });
  await page.waitForTimeout(1000);
}

async function clickFirstVisibleButton(page: Page, name: RegExp): Promise<boolean> {
  const buttons = page.getByRole('button', { name });
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ force: true });
      return true;
    }
  }
  return false;
}

/** 解析「Resend Code in 18s」类文案，返回剩余秒数 */
async function getResendCooldownSeconds(page: Page): Promise<number | null> {
  const text = await page.locator('body').innerText();
  const match = text.match(/resend code in\s*(\d+)\s*s/i);
  return match ? Number(match[1]) : null;
}

/** 若处于发码冷却，等待冷却结束 */
async function waitForResendCooldown(page: Page): Promise<void> {
  const seconds = await getResendCooldownSeconds(page);
  if (seconds !== null && seconds > 0) {
    console.log(`验证码发送冷却中，等待 ${seconds + 2}s…`);
    await page.waitForTimeout((seconds + 2) * 1000);
  }
}

/** 验证码步骤标题；勿用宽泛的 /verification code/（邮箱页副标题也会命中） */
const VERIFICATION_CODE_HEADING = /what'?s your verification code\??/i;

async function isOnVerificationCodeStep(page: Page): Promise<boolean> {
  if (await page.getByText(VERIFICATION_CODE_HEADING).first().isVisible({ timeout: 1500 }).catch(() => false)) {
    return true;
  }
  const hash = await page.evaluate(() => location.hash).catch(() => '');
  if (hash === '#step_3') return true;
  const otpBoxes = page.locator('input[maxlength="1"], input[inputmode="numeric"]');
  return (await otpBoxes.count()) >= 4;
}

async function fillEmailAndSendCode(page: Page, email: string): Promise<void> {
  const emailInput = page
    .getByRole('textbox', { name: /email/i })
    .or(page.locator('input[placeholder="Email"]'));
  await emailInput.first().waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.first().fill(email);

  for (let attempt = 0; attempt < 3; attempt++) {
    if (await isOnVerificationCodeStep(page)) return;

    await waitForResendCooldown(page);

    const sendBtn = page.getByRole('button', { name: /send code/i });
    await sendBtn.first().waitFor({ state: 'visible', timeout: 10_000 });

    if (await sendBtn.first().isDisabled().catch(() => false)) {
      await waitForResendCooldown(page);
      continue;
    }

    await sendBtn.first().click();

    try {
      await page.waitForFunction(
        () =>
          location.hash === '#step_3' ||
          /what'?s your verification code\??/i.test(document.body.innerText),
        { timeout: 25_000 }
      );
      await page.waitForTimeout(1000);
      return;
    } catch {
      await waitForResendCooldown(page);
    }
  }

  if (await isOnVerificationCodeStep(page)) return;
  throw new Error('Send Code 后未能进入验证码步骤（可能触发发码频率限制）');
}

/** 收集验证码 OTP 输入框（排除 Email） */
async function collectOtpInputs(page: Page): Promise<Locator[]> {
  await page.waitForFunction(
    () => {
      const inputs = [...document.querySelectorAll('input')].filter((el) => {
        const input = el as HTMLInputElement;
        if (!input.offsetParent && getComputedStyle(input).visibility === 'hidden') return false;
        const ph = input.placeholder ?? '';
        const type = (input.type ?? '').toLowerCase();
        if (type === 'email' || ph === 'Email') return false;
        return true;
      });
      return inputs.length >= 4;
    },
    { timeout: 20_000 }
  ).catch(() => {});

  const otp: Locator[] = [];
  const visibleInputs = page.locator('input:visible');
  const count = await visibleInputs.count();
  for (let i = 0; i < count; i++) {
    const input = visibleInputs.nth(i);
    const type = ((await input.getAttribute('type')) ?? '').toLowerCase();
    const ph = (await input.getAttribute('placeholder')) ?? '';
    if (type === 'email' || ph === 'Email') continue;
    otp.push(input);
  }
  if (otp.length >= 4) return otp.slice(0, 4);

  const textboxes = page.getByRole('textbox');
  const textboxCount = await textboxes.count();
  for (let i = 0; i < textboxCount; i++) {
    const box = textboxes.nth(i);
    const ph = (await box.getAttribute('placeholder').catch(() => null)) ?? '';
    const aria = (await box.getAttribute('aria-label').catch(() => null)) ?? '';
    if (/email/i.test(ph) || /email/i.test(aria)) continue;
    otp.push(box);
  }
  if (otp.length >= 4) return otp.slice(0, 4);

  const codeInputs = page.locator(
    'input[type="tel"], input[inputmode="numeric"], input[maxlength="1"]'
  );
  if ((await codeInputs.count()) >= 4) {
    return [codeInputs.nth(0), codeInputs.nth(1), codeInputs.nth(2), codeInputs.nth(3)];
  }

  return otp;
}

async function fillVerificationCode(page: Page, code: string = CODE): Promise<void> {
  await page
    .getByText(VERIFICATION_CODE_HEADING)
    .first()
    .waitFor({ state: 'visible', timeout: 20_000 });

  const otp = await collectOtpInputs(page);

  if (otp.length >= 4) {
    for (let i = 0; i < 4; i++) {
      await otp[i].click();
      await otp[i].fill('');
      await otp[i].pressSequentially(code[i], { delay: 80 });
    }
  } else if (otp.length === 1) {
    await otp[0].click();
    await otp[0].fill('');
    await otp[0].pressSequentially(code, { delay: 80 });
  } else if (otp.length > 0) {
    for (let i = 0; i < Math.min(4, otp.length); i++) {
      await otp[i].click();
      await otp[i].fill(code[i]);
    }
  } else {
    // 部分 WebView 将 OTP 合并为一个可聚焦区域
    await page.locator('body').click({ position: { x: 200, y: 300 } });
    await page.keyboard.type(code, { delay: 100 });
  }

  await page.waitForTimeout(800);
}

async function clickNextWhenEnabled(page: Page): Promise<void> {
  if (/\/home/.test(page.url())) return;

  await page.waitForTimeout(1000);
  const next = page.getByRole('button', { name: /^next$/i }).first();
  const nextVisible = await next.isVisible({ timeout: 10_000 }).catch(() => false);
  if (!nextVisible) {
    await page.waitForURL(/\/home/, { timeout: 30_000 }).catch(() => {});
    if (/\/home/.test(page.url())) return;
    throw new Error('Next 按钮未出现且未跳转至 Home（请检查验证码是否已完整填入）');
  }
  for (let i = 0; i < 80; i++) {
    if (!(await next.isDisabled().catch(() => true))) {
      await next.click();
      await page.waitForTimeout(2500);
      return;
    }
    await page.waitForTimeout(500);
  }
  throw new Error('Next 按钮未变为可点击状态（请检查验证码是否已完整填入）');
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

    const advanced = page
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
    const clicked = await clickFirstVisibleButton(page, /^log in$/i);
    if (!clicked) {
      await page.getByRole('button', { name: /^log in$/i }).first().waitFor({ state: 'visible', timeout: 10_000 });
    }
    await page.waitForTimeout(2000);
    await dismissAgeGate(page);
  }

  await dismissAgeGate(page);
  await loginEmail
    .or(page.getByText('Sign up with Email', { exact: true }))
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 });
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

/** Worker 内首次登录并写入 storageState（仅无缓存或 AUTH_REFRESH=1 时调用） */
export async function loginCreatorFresh(browser: Browser): Promise<string> {
  const file = authStoragePath(CREATOR_ROLE);
  clearAuthStorage(CREATOR_ROLE);

  const context = await browser.newContext({ baseURL: testData.baseURL });
  const page = await context.newPage();
  await resetBrowserSession(page);
  await loginAsCreator(page);
  await page.goto('/home');
  await dismissAgeGate(page);
  await dismissPushNotification(page);
  await waitForHomeSidebar(page);
  await context.storageState({ path: file });
  await context.close();
  console.log(`Creator 登录态已缓存: ${file}`);
  return file;
}

/**
 * 业务用例 fixture 使用：复用缓存 token；仅当 /home 检测到未登录时才重新登录并更新缓存。
 */
export async function ensureCreatorSession(page: Page): Promise<void> {
  await page.goto('/home');
  await dismissAgeGate(page);
  await dismissPushNotification(page);

  if (await isLoggedInHome(page)) {
    return;
  }

  console.log('Creator token 已失效，自动重新登录…');
  await resetBrowserSession(page);
  await loginAsCreator(page);
  await saveAuthStorage(page, CREATOR_ROLE);
  await page.goto('/home');
  await dismissAgeGate(page);
  await dismissPushNotification(page);
  await waitForHomeSidebar(page);
}

/** @deprecated 请使用 ensureCreatorSession；勿在业务用例中调用 */
export async function ensureCreatorAuthenticated(page: Page): Promise<void> {
  await ensureCreatorSession(page);
}

/** @deprecated 请使用 ensureCreatorSession */
export async function gotoAuthenticatedHome(page: Page): Promise<void> {
  await ensureCreatorSession(page);
}
