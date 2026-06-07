import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const CREATOR_EMAIL = 'haaaaaaaa@wegrowth.dev';
const TEST_CODE = '0124';
const SCREENSHOT_DIR = path.join(process.cwd(), 'reports', 'explore-screenshots');

async function dismissAgeGate(page: import('@playwright/test').Page) {
  const over18 = page.getByText(/i'?m over 18/i).or(page.getByRole('button', { name: /over 18/i }));
  await over18.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null);
  if (await over18.first().isVisible().catch(() => false)) {
    await over18.first().click({ force: true });
    await page.waitForTimeout(2000);
  }
}

async function clickEmailAuth(page: import('@playwright/test').Page, mode: 'login' | 'signup') {
  const label = mode === 'login' ? 'Log in with Email' : 'Sign up with Email';
  const btn = page.getByText(label, { exact: true }).locator('xpath=..');
  await btn.click({ force: true });
  await page.waitForTimeout(1500);
}

async function fillEmailAndSendCode(page: import('@playwright/test').Page, email: string) {
  const emailInput = page.locator('input').filter({ hasNot: page.locator('[type="hidden"]') }).first();
  await emailInput.fill(email);
  await page.getByRole('button', { name: /send code/i }).click();
  await page.waitForTimeout(2000);
}

async function fillVerificationCode(page: import('@playwright/test').Page, code: string) {
  const inputs = page.locator('input[type="text"], input[type="number"], input[inputmode="numeric"], input[maxlength="1"]');
  const count = await inputs.count();
  if (count >= 4) {
    for (let i = 0; i < 4; i++) await inputs.nth(i).fill(code[i]);
  } else if (count === 1) {
    await inputs.first().fill(code);
  } else {
    const otp = page.locator('input').filter({ has: page.locator(':scope') });
    for (let i = 0; i < Math.min(await otp.count(), 4); i++) {
      await otp.nth(i).fill(code[i]);
    }
  }
  await page.waitForTimeout(1000);
}

test('Creator 登录 + Post 探索', async ({ page }) => {
  test.setTimeout(180_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const findings: Record<string, unknown> = { steps: [] as unknown[] };

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await dismissAgeGate(page);
  await page.waitForTimeout(1500);

  const loginBtn = page.getByRole('button', { name: /^log in$/i });
  await loginBtn.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'creator-login-modal.png'), fullPage: true });

  await clickEmailAuth(page, 'login');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'creator-email-step.png'), fullPage: true });
  (findings.steps as unknown[]).push({ step: 'email-entry', url: page.url(), aria: await page.locator('body').ariaSnapshot() });

  await fillEmailAndSendCode(page, CREATOR_EMAIL);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'creator-after-send-code.png'), fullPage: true });
  (findings.steps as unknown[]).push({ step: 'after-send-code', url: page.url(), aria: await page.locator('body').ariaSnapshot() });

  await fillVerificationCode(page, TEST_CODE);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'creator-code-filled.png'), fullPage: true });

  const submitBtn = page.getByRole('button', { name: /verify|continue|log in|confirm|next/i });
  if (await submitBtn.first().isVisible().catch(() => false)) {
    await submitBtn.first().click();
    await page.waitForTimeout(4000);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'creator-logged-in.png'), fullPage: true });
  (findings.steps as unknown[]).push({
    step: 'after-login',
    url: page.url(),
    title: await page.title(),
    buttons: await page.getByRole('button').allTextContents(),
    links: await page.getByRole('link').allTextContents(),
    aria: await page.locator('body').ariaSnapshot(),
  });

  // 探索创建帖子
  const createCandidates = [
    page.getByRole('button', { name: /create post|new post|compose|write/i }),
    page.getByRole('link', { name: /create post|new post/i }),
    page.locator('[aria-label*="post" i], [aria-label*="create" i]'),
    page.getByText(/^\+$/),
    page.getByText(/create/i).filter({ has: page.locator('svg, img') }),
  ];
  let clicked = false;
  for (const loc of createCandidates) {
    if (await loc.count() > 0 && await loc.first().isVisible().catch(() => false)) {
      const text = await loc.first().textContent();
      await loc.first().click({ force: true });
      await page.waitForTimeout(2000);
      (findings.steps as unknown[]).push({ step: 'create-post-click', clicked: text?.trim(), url: page.url() });
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    (findings.steps as unknown[]).push({
      step: 'create-post-not-found',
      allButtons: await page.getByRole('button').allTextContents(),
      allLinks: (await page.getByRole('link').allTextContents()).slice(0, 30),
    });
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'creator-post-form.png'), fullPage: true });

  const publishBtn = page.getByRole('button', { name: /publish|post now|share|submit/i });
  if (await publishBtn.count() > 0) {
    (findings.steps as unknown[]).push({
      step: 'publish-button',
      labels: await publishBtn.allTextContents(),
      disabled: await publishBtn.first().isDisabled().catch(() => null),
    });
  }

  const textarea = page.locator('textarea, [contenteditable="true"]').first();
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill('Playwright explore - do not publish');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'creator-post-content.png'), fullPage: true });
  }

  // 尝试导航到 creator dashboard / profile
  for (const pattern of [/dashboard/i, /my room/i, /profile/i, /posts/i, /studio/i]) {
    const nav = page.getByRole('link', { name: pattern }).or(page.getByRole('button', { name: pattern }));
    if (await nav.count() > 0 && await nav.first().isVisible().catch(() => false)) {
      await nav.first().click();
      await page.waitForTimeout(2000);
      (findings.steps as unknown[]).push({ step: `nav-${pattern.source}`, url: page.url() });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `creator-nav-${pattern.source}.png`), fullPage: true });
      break;
    }
  }

  fs.writeFileSync(path.join(process.cwd(), 'reports', 'creator-post-exploration.json'), JSON.stringify(findings, null, 2));
  console.log('Creator post exploration saved');
  expect(page.url()).toBeTruthy();
});
