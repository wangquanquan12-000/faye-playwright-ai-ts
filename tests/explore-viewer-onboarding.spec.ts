import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TEST_EMAIL = 'UItest0607@wegrowth.dev';
const TEST_CODE = '0124';
const CREATOR_EMAIL = 'haaaaaaaa@wegrowth.dev';
const SCREENSHOT_DIR = path.join(process.cwd(), 'reports', 'explore-screenshots');
const REPORT_PATH = path.join(process.cwd(), 'reports', 'viewer-onboarding-exploration.json');

interface ElementInfo {
  role?: string;
  name?: string;
  placeholder?: string;
  type?: string;
  selector?: string;
  text?: string;
  disabled?: boolean;
}

interface StepDoc {
  step: number;
  name: string;
  url: string;
  hash?: string;
  heading?: string;
  description?: string;
  inputs: ElementInfo[];
  buttons: ElementInfo[];
  links: ElementInfo[];
  otherText: string[];
  proceed: string;
  ariaSnapshot: string;
  screenshot: string;
}

async function dismissAgeGate(page: Page) {
  const over18 = page.getByText(/i'?m over 18/i).or(page.getByRole('button', { name: /over 18/i }));
  if (await over18.first().isVisible({ timeout: 10_000 }).catch(() => false)) {
    await over18.first().click({ force: true });
    await page.waitForTimeout(2000);
  }
}

async function collectInputs(page: Page): Promise<ElementInfo[]> {
  const out: ElementInfo[] = [];
  const inputs = page.locator('input:visible, textarea:visible, select:visible, [contenteditable="true"]:visible');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    const id = await el.getAttribute('id');
    const name = await el.getAttribute('name');
    const placeholder = await el.getAttribute('placeholder');
    const type = await el.getAttribute('type');
    const ariaLabel = await el.getAttribute('aria-label');
    const tag = await el.evaluate((n) => n.tagName);
    out.push({
      role: tag === 'TEXTAREA' ? 'textbox' : tag === 'SELECT' ? 'combobox' : 'textbox',
      name: ariaLabel || name || undefined,
      placeholder: placeholder || undefined,
      type: type || (tag === 'TEXTAREA' ? 'textarea' : tag.toLowerCase()),
      selector: id ? `#${id}` : name ? `[name="${name}"]` : placeholder ? `input[placeholder="${placeholder}"]` : undefined,
    });
  }
  return out;
}

async function collectButtons(page: Page): Promise<ElementInfo[]> {
  const out: ElementInfo[] = [];
  const btns = page.getByRole('button');
  const count = await btns.count();
  for (let i = 0; i < Math.min(count, 30); i++) {
    const el = btns.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    const text = (await el.textContent())?.trim().slice(0, 100);
    const ariaLabel = await el.getAttribute('aria-label');
    const disabled = await el.isDisabled().catch(() => false);
    out.push({
      role: 'button',
      name: ariaLabel || text || undefined,
      text,
      disabled,
      selector: text ? `getByRole('button', { name: /${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/i })` : undefined,
    });
  }
  return out;
}

async function collectLinks(page: Page): Promise<ElementInfo[]> {
  const out: ElementInfo[] = [];
  const links = page.getByRole('link');
  const count = await links.count();
  for (let i = 0; i < Math.min(count, 20); i++) {
    const el = links.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    const text = (await el.textContent())?.trim().slice(0, 80);
    const href = await el.getAttribute('href');
    out.push({ role: 'link', name: text, text, selector: href ? `a[href="${href}"]` : undefined });
  }
  return out;
}

async function extractMainText(page: Page): Promise<{ heading?: string; description?: string; otherText: string[] }> {
  const bodyText = await page.locator('body').innerText();
  const lines = bodyText.split('\n').map((l) => l.trim()).filter((l) => l.length > 2 && l.length < 200);
  const headingPatterns = [/what'?s your/i, /birthday/i, /username/i, /avatar/i, /role/i, /verification/i, /email/i, /welcome/i, /choose/i, /select/i, /create/i, /publish/i, /caption/i];
  const heading = lines.find((l) => headingPatterns.some((p) => p.test(l)));
  const description = lines.find((l) => /sent to|we will|enter|pick|upload|multiple/i.test(l));
  const skip = new Set(['RM11', 'Language', 'Home', 'Profile', 'Post', 'Publish', 'Notifications', 'Messages']);
  const otherText = lines.filter((l) => !skip.has(l) && l !== heading && l !== description).slice(0, 15);
  return { heading, description, otherText };
}

async function documentScreen(page: Page, step: number, name: string, proceed: string): Promise<StepDoc> {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshot = `viewer-onboard-${String(step).padStart(2, '0')}-${name.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}.png`;
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, screenshot), fullPage: true });
  const { heading, description, otherText } = await extractMainText(page);
  const url = page.url();
  return {
    step,
    name,
    url,
    hash: new URL(url).hash || undefined,
    heading,
    description,
    inputs: await collectInputs(page),
    buttons: await collectButtons(page),
    links: await collectLinks(page),
    otherText,
    proceed,
    ariaSnapshot: await page.locator('body').ariaSnapshot().catch(() => ''),
    screenshot,
  };
}

async function clickNext(page: Page) {
  const next = page.getByRole('button', { name: /next|continue|confirm|done|save|submit|finish|get started|skip/i });
  if (!(await next.first().isVisible().catch(() => false))) return false;
  await next.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
  for (let i = 0; i < 20; i++) {
    if (!(await next.first().isDisabled().catch(() => true))) {
      await next.first().click();
      await page.waitForTimeout(2500);
      return true;
    }
    await page.waitForTimeout(300);
  }
  return false;
}

async function waitForCodeStep(page: Page) {
  await page.waitForFunction(
    () => location.hash === '#step_3' || /verification code/i.test(document.body.innerText),
    { timeout: 20_000 }
  ).catch(() => null);
  await page.waitForTimeout(1500);
}

async function fillVerificationCode(page: Page, code: string) {
  const codeInputs = page.locator(
    'input[type="text"]:not([type="email"]):not([placeholder="Email"]), input[inputmode="numeric"], input[maxlength="1"]'
  ).filter({ hasNot: page.locator('[placeholder="Email"]') });
  const count = await codeInputs.count();
  if (count >= 4) {
    for (let i = 0; i < 4; i++) await codeInputs.nth(i).fill(code[i]);
  } else {
    const allText = page.locator('input[type="text"]:visible, input[inputmode="numeric"]:visible');
    const n = await allText.count();
    for (let i = 0; i < Math.min(n, 4); i++) {
      const ph = await allText.nth(i).getAttribute('placeholder');
      if (ph === 'Email') continue;
      await allText.nth(i).fill(code[i] || code[0]);
    }
  }
  await page.waitForTimeout(1000);
}

async function clickNextWhenEnabled(page: Page) {
  const next = page.getByRole('button', { name: /^next$/i });
  for (let i = 0; i < 30; i++) {
    if (await next.isVisible().catch(() => false) && !(await next.isDisabled().catch(() => true))) {
      await next.click();
      await page.waitForTimeout(2500);
      return true;
    }
    await page.waitForTimeout(300);
  }
  return false;
}

async function tryCompleteOnboardingStep(page: Page, stepName: string): Promise<boolean> {
  const lower = stepName.toLowerCase();
  if (/birthday|birth|date/.test(lower)) {
    const mm = page.locator('input[placeholder="MM"]');
    const dd = page.locator('input[placeholder="DD"]');
    const yyyy = page.locator('input[placeholder="YYYY"]');
    if (await mm.isVisible().catch(() => false)) {
      await mm.fill('06');
      await dd.fill('07');
      await yyyy.fill('1995');
      await page.waitForTimeout(500);
      return clickNext(page);
    }
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill('1995-06-07');
      return clickNext(page);
    }
  }
  if (/username|user name|display|what.?s your name|pick a name/i.test(lower)) {
    const uname = page.locator('input[placeholder*="name" i], input[placeholder*="user" i]')
      .or(page.getByRole('textbox'))
      .first();
    if (await uname.isVisible().catch(() => false)) {
      await uname.fill(`uitest0607_${Date.now().toString().slice(-4)}`);
      await page.waitForTimeout(500);
      return clickNext(page);
    }
  }
  if (/avatar|photo|profile picture/.test(lower)) {
    const skip = page.getByRole('button', { name: /skip/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(2000);
      return true;
    }
    return clickNext(page);
  }
  if (/role|viewer|creator|fan/.test(lower)) {
    const viewer = page.getByText(/viewer|fan|explore/i).first();
    if (await viewer.isVisible().catch(() => false)) {
      await viewer.click();
      await page.waitForTimeout(1000);
    }
    return clickNext(page);
  }
  return clickNext(page);
}

function ensureTestImage(): string {
  const fixtureDir = path.join(process.cwd(), 'tests', 'fixtures');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const imgPath = path.join(fixtureDir, 'test-image.png');
  if (!fs.existsSync(imgPath)) {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(imgPath, png);
  }
  return imgPath;
}

test('Viewer 注册 onboarding + Post step2 探索', async ({ page }) => {
  test.setTimeout(300_000);
  const report: { email: string; registration: StepDoc[]; postStep2: StepDoc[]; completed: boolean; notes: string[] } = {
    email: TEST_EMAIL,
    registration: [],
    postStep2: [],
    completed: false,
    notes: [],
  };

  // === Registration flow ===
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await dismissAgeGate(page);

  report.registration.push(await documentScreen(page, 0, 'age-gate-dismissed', '点击 I\'m over 18'));

  const emailSignUp = page.getByText('Sign up with Email', { exact: true }).locator('xpath=..');
  await emailSignUp.waitFor({ state: 'visible', timeout: 10_000 });
  await emailSignUp.click({ force: true });
  const emailInput = page.getByRole('textbox', { name: /email/i }).or(page.locator('input[placeholder="Email"]'));
  await emailInput.first().waitFor({ state: 'visible', timeout: 15_000 });
  report.registration.push(await documentScreen(page, 1, 'email-entry', '填写邮箱并点击 Send Code'));
  await emailInput.first().fill(TEST_EMAIL);
  await page.getByRole('button', { name: /send code/i }).click();
  await waitForCodeStep(page);
  report.registration.push(await documentScreen(page, 2, 'code-entry', '填写 4 位验证码 0124，点击 Next'));

  await fillVerificationCode(page, TEST_CODE);
  await clickNextWhenEnabled(page);
  await page.waitForTimeout(2000);
  report.registration.push(await documentScreen(page, 3, 'after-verify', '验证码提交后首屏 onboarding'));

  // Walk through subsequent onboarding screens (max 10 steps)
  const seenHashes = new Set<string>();
  for (let i = 4; i < 14; i++) {
    const hash = new URL(page.url()).hash;
    const aria = await page.locator('body').ariaSnapshot().catch(() => '');
    const key = hash + aria.slice(0, 200);
    if (seenHashes.has(key)) break;
    seenHashes.add(key);

    const { heading } = await extractMainText(page);
    const stepName = heading || `onboarding-step-${i}`;
    const doc = await documentScreen(page, i, stepName, '见 proceed 字段');
    report.registration.push(doc);

    if (/\/home/.test(page.url()) || /welcome|you.?re all set|complete/i.test(aria)) {
      report.completed = true;
      report.notes.push(`注册完成于 step ${i}, url=${page.url()}`);
      break;
    }

    const advanced = await tryCompleteOnboardingStep(page, stepName + ' ' + aria);
    if (!advanced) {
      const clicked = await clickNext(page);
      if (!clicked) {
        report.notes.push(`Step ${i} (${stepName}) 无法前进，停止`);
        break;
      }
    }
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // === Post publish step 2 exploration (creator login) ===
  await page.context().clearCookies();
  await page.goto('/');
  await dismissAgeGate(page);
  const loginBtn = page.getByRole('button', { name: /^log in$/i });
  if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginBtn.click({ force: true });
    await page.waitForTimeout(1500);
    const loginEmail = page.getByText('Log in with Email', { exact: true }).locator('xpath=..');
    await loginEmail.waitFor({ state: 'visible', timeout: 10_000 });
    await loginEmail.click({ force: true });
    await page.getByRole('textbox', { name: /email/i }).fill(CREATOR_EMAIL);
    await page.getByRole('button', { name: /send code/i }).click();
    await waitForCodeStep(page);
    await fillVerificationCode(page, TEST_CODE);
    await clickNextWhenEnabled(page);
    await page.waitForURL(/\/home/, { timeout: 30_000 });
    await page.waitForTimeout(2000);
  } else {
    report.notes.push('未找到 Log in，尝试直接访问 /home');
    await page.goto('/home');
    await page.waitForTimeout(2000);
  }

  const allowBtn = page.getByRole('button', { name: /^allow$/i });
  if (await allowBtn.isVisible().catch(() => false)) await allowBtn.click();
  await page.locator('nav').getByText(/^(Post|Publish)$/, { exact: true }).click();
  await page.waitForTimeout(1500);
  await page.getByText('New Post', { exact: true }).click();
  await page.waitForTimeout(2500);

  report.postStep2.push(await documentScreen(page, 1, 'post-step1-upload', '上传图片后点击 Next'));

  const imgPath = ensureTestImage();
  const fileInput = page.locator('input[type="file"]');
  if (await fileInput.count() > 0) {
    await fileInput.first().setInputFiles(imgPath);
    await page.waitForTimeout(3000);
    report.notes.push('已上传 tests/fixtures/test-image.png');
  } else {
    report.notes.push('未找到 file input，尝试点击上传区域');
    const uploadArea = page.getByText(/image|upload|drag/i).first();
    if (await uploadArea.isVisible().catch(() => false)) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => [null]),
        uploadArea.click(),
      ]);
      if (fileChooser) {
        await fileChooser.setFiles(imgPath);
        await page.waitForTimeout(3000);
      }
    }
  }

  report.postStep2.push(await documentScreen(page, 2, 'post-step1-after-upload', '上传后状态'));

  await page.waitForTimeout(2000);
  const nextImg = page.getByRole('button', { name: /next/i }).or(page.locator('img[alt="Next"]').locator('xpath=..'));
  if (await nextImg.first().isVisible().catch(() => false)) {
    await nextImg.first().click({ force: true });
    await page.waitForTimeout(3000);
  }
  report.postStep2.push(await documentScreen(page, 3, 'post-step1b-cover', 'Step1b: 选 Cover 后点 Next'));

  if (await nextImg.first().isVisible().catch(() => false)) {
    await nextImg.first().click({ force: true });
    await page.waitForTimeout(3000);
  }
  report.postStep2.push(await documentScreen(page, 4, 'post-step2-caption', 'Step2: caption/publish 字段'));

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  expect(report.registration.length).toBeGreaterThan(3);
});
