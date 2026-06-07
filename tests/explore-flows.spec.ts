import { test, expect, type Page, type Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE = process.env.BASE_URL || 'https://faye-test.link';
const CREATOR_EMAIL = 'haaaaaaaa@wegrowth.dev';
const TEST_CODE = '0124';
const SCREENSHOT_DIR = path.join(process.cwd(), 'reports', 'explore-screenshots');

interface ElementInfo {
  role?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  type?: string;
  selector?: string;
  text?: string;
  href?: string;
  disabled?: boolean;
  visible?: boolean;
}

interface StepInfo {
  step: number;
  action: string;
  url: string;
  title: string;
  elements: ElementInfo[];
  ariaSnapshot?: string;
  notes: string[];
}

interface FlowReport {
  flow: string;
  steps: StepInfo[];
  blockers: string[];
}

async function dismissModals(page: Page): Promise<string[]> {
  const dismissed: string[] = [];
  const modalSelectors = [
    page.getByRole('button', { name: /confirm|accept|i am 18|yes|enter|continue|got it|ok/i }),
    page.getByText(/18\+|18 years|adult/i).locator('..').getByRole('button'),
  ];
  for (const btn of modalSelectors) {
    try {
      if (await btn.first().isVisible({ timeout: 2000 })) {
        const text = await btn.first().textContent();
        await btn.first().click();
        dismissed.push(`Dismissed modal via button: ${text?.trim()}`);
        await page.waitForTimeout(500);
      }
    } catch {
      /* no modal */
    }
  }
  return dismissed;
}

async function collectVisibleElements(page: Page): Promise<ElementInfo[]> {
  const elements: ElementInfo[] = [];

  const roles = ['button', 'textbox', 'link', 'checkbox', 'radio', 'combobox', 'heading', 'tab'] as const;
  for (const role of roles) {
    const loc = page.getByRole(role);
    const count = await loc.count();
    for (let i = 0; i < Math.min(count, 30); i++) {
      const el = loc.nth(i);
      try {
        if (!(await el.isVisible())) continue;
        const name = await el.getAttribute('aria-label') || (await el.textContent())?.trim().slice(0, 100) || '';
        const placeholder = role === 'textbox' ? await el.getAttribute('placeholder') : undefined;
        const type = role === 'textbox' ? await el.getAttribute('type') : undefined;
        elements.push({
          role,
          name: name || undefined,
          placeholder: placeholder || undefined,
          type: type || undefined,
          visible: true,
        });
      } catch {
        /* skip */
      }
    }
  }

  const inputs = page.locator('input:visible, textarea:visible, select:visible');
  const inputCount = await inputs.count();
  for (let i = 0; i < Math.min(inputCount, 20); i++) {
    const el = inputs.nth(i);
    try {
      const id = await el.getAttribute('id');
      const name = await el.getAttribute('name');
      const placeholder = await el.getAttribute('placeholder');
      const type = await el.getAttribute('type');
      const ariaLabel = await el.getAttribute('aria-label');
      elements.push({
        selector: id ? `#${id}` : name ? `[name="${name}"]` : undefined,
        label: ariaLabel || undefined,
        placeholder: placeholder || undefined,
        type: type || undefined,
        visible: true,
      });
    } catch {
      /* skip */
    }
  }

  return elements;
}

async function captureStep(
  page: Page,
  step: number,
  action: string,
  screenshotName: string,
  notes: string[] = []
): Promise<StepInfo> {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, screenshotName), fullPage: true });
  const elements = await collectVisibleElements(page);
  return {
    step,
    action,
    url: page.url(),
    title: await page.title(),
    elements,
    ariaSnapshot: await getAriaSnapshot(page),
    notes,
  };
}

async function safeClick(locator: Locator, force = false): Promise<void> {
  try {
    await locator.click({ force, timeout: 10_000 });
  } catch {
    const box = await locator.boundingBox();
    if (box) {
      await locator.page().mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else {
      throw new Error('无法点击元素');
    }
  }
}

async function findClickable(page: Page, patterns: RegExp[]): Promise<Locator | null> {
  for (const pattern of patterns) {
    const btn = page.getByRole('button', { name: pattern });
    if (await btn.count() > 0 && await btn.first().isVisible()) return btn.first();
    const link = page.getByRole('link', { name: pattern });
    if (await link.count() > 0 && await link.first().isVisible()) return link.first();
  }
  for (const pattern of patterns) {
    const container = page.locator('.dialog, [class*="dialog"]').getByText(pattern).locator('xpath=ancestor::*[contains(@class,"cursor-pointer") or self::button][1]');
    if (await container.count() > 0 && await container.first().isVisible()) return container.first();
    const textParent = page.getByText(pattern).locator('xpath=..');
    if (await textParent.count() > 0 && await textParent.first().isVisible()) return textParent.first();
  }
  return null;
}

async function getAriaSnapshot(page: Page): Promise<string> {
  try {
    return await page.locator('body').ariaSnapshot();
  } catch {
    return '';
  }
}

test.describe('UI Flow Exploration', () => {
  test.setTimeout(300_000);

  test('探索全部流程并生成报告', async ({ page }) => {
    const report: { exploredAt: string; baseURL: string; flows: FlowReport[] } = {
      exploredAt: new Date().toISOString(),
      baseURL: BASE,
      flows: [],
    };

    // ========== Flow 1: Viewer Registration (Email) ==========
    const regFlow: FlowReport = { flow: 'Viewer Registration (Email)', steps: [], blockers: [] };
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const modalNotes = await dismissModals(page);
    regFlow.blockers.push(...modalNotes);

    regFlow.steps.push(await captureStep(page, 1, '访问首页 /', '01-home.png', modalNotes));

    const signUpModal = page.locator('.dialog').filter({ hasText: /sign up with email/i });
    if (await signUpModal.isVisible().catch(() => false)) {
      regFlow.steps.push(await captureStep(page, 2, '首页自动弹出 Sign up 弹窗', '02-signup-modal.png'));
    } else {
      const signUpBtn = await findClickable(page, [/^sign up$/i, /join rm11/i]);
      if (signUpBtn) {
        await safeClick(signUpBtn);
        await page.waitForTimeout(1500);
        regFlow.steps.push(await captureStep(page, 2, '点击 Sign up 入口', '02-signup-entry.png'));
      } else {
        regFlow.blockers.push('未找到 Sign up 入口按钮');
      }
    }

    const emailSignUp = page.locator('.dialog').getByText(/sign up with email/i).locator('xpath=ancestor::div[contains(@class,"cursor-pointer") or position()=1][1]');
    if (await emailSignUp.count() === 0) {
      const fallback = page.getByText('Sign up with Email', { exact: true }).locator('xpath=..');
      if (await fallback.isVisible().catch(() => false)) {
        await safeClick(fallback, true);
      }
    } else {
      await safeClick(emailSignUp.first(), true);
    }
    await page.waitForTimeout(1500);
    regFlow.steps.push(await captureStep(page, 3, '选择 Email 注册', '03-email-signup.png'));

    const emailInput = page.getByRole('textbox', { name: /email/i }).or(page.locator('input[type="email"]')).first();
    if (await emailInput.isVisible().catch(() => false)) {
      const testEmail = `explore_${Date.now()}@test.auto`;
      await emailInput.fill(testEmail);
      regFlow.steps.push(await captureStep(page, 4, `填写邮箱 ${testEmail}`, '04-email-filled.png'));

      const sendCodeBtn = await findClickable(page, [/send code/i, /send verification/i, /get code/i, /continue/i]);
      if (sendCodeBtn) {
        const disabled = await sendCodeBtn.isDisabled().catch(() => false);
        regFlow.steps.push(await captureStep(page, 5, `Send code 按钮 (disabled=${disabled})`, '05-before-send-code.png'));
        if (!disabled) {
          await sendCodeBtn.click();
          await page.waitForTimeout(2000);
          regFlow.steps.push(await captureStep(page, 6, '点击 Send code', '06-after-send-code.png'));
        }
      }

      const codeInputs = page.locator('input[type="text"], input[type="number"], input[inputmode="numeric"]');
      const codeCount = await codeInputs.count();
      if (codeCount > 0) {
        for (let i = 0; i < codeCount; i++) {
          const inp = codeInputs.nth(i);
          if (await inp.isVisible()) {
            await inp.fill(TEST_CODE[i] || TEST_CODE[0]);
          }
        }
        regFlow.steps.push(await captureStep(page, 7, `填写验证码 ${TEST_CODE}`, '07-code-filled.png'));

        const verifyBtn = await findClickable(page, [/verify/i, /continue/i, /next/i, /confirm/i]);
        if (verifyBtn) {
          await verifyBtn.click();
          await page.waitForTimeout(2000);
          regFlow.steps.push(await captureStep(page, 8, '提交验证码', '08-after-verify.png'));
        }
      }
    }

    const birthdayField = page.getByRole('textbox', { name: /birthday|birth|date/i })
      .or(page.locator('input[type="date"]'))
      .or(page.getByText(/birthday|date of birth/i));
    if (await birthdayField.first().isVisible().catch(() => false)) {
      regFlow.steps.push(await captureStep(page, 9, '生日步骤', '09-birthday.png'));
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible().catch(() => false)) {
        await dateInput.fill('1990-01-15');
      }
    }

    const usernameField = page.getByRole('textbox', { name: /username|user name|display name/i })
      .or(page.locator('input[name*="user"], input[placeholder*="user"]'));
    if (await usernameField.first().isVisible().catch(() => false)) {
      await usernameField.first().fill(`explore_user_${Date.now().toString().slice(-6)}`);
      regFlow.steps.push(await captureStep(page, 10, '用户名步骤', '10-username.png'));
    }

    const avatarSection = page.getByText(/avatar|profile photo|upload/i);
    if (await avatarSection.first().isVisible().catch(() => false)) {
      regFlow.steps.push(await captureStep(page, 11, '头像步骤', '11-avatar.png'));
    }

    regFlow.steps.push(await captureStep(page, 12, '注册流程最终状态（不完成提交）', '12-reg-final.png', ['未提交最终注册以避免创建永久账号']));
    report.flows.push(regFlow);

    // ========== Flow 2: Viewer Login (Email) ==========
    const loginFlow: FlowReport = { flow: 'Viewer Login (Email)', steps: [], blockers: [] };
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await dismissModals(page);

    loginFlow.steps.push(await captureStep(page, 1, '访问首页', 'login-01-home.png'));

    const loginBtn = page.getByRole('button', { name: /^log in$/i });
    if (await loginBtn.isVisible().catch(() => false)) {
      await safeClick(loginBtn);
      await page.waitForTimeout(1500);
      loginFlow.steps.push(await captureStep(page, 2, '点击 Log in', 'login-02-entry.png'));
    } else {
      loginFlow.blockers.push('未找到 Log in 按钮');
    }

    const loginEmailInput = page.getByRole('textbox', { name: /email/i }).or(page.locator('input[type="email"]')).first();
    if (await loginEmailInput.isVisible().catch(() => false)) {
      await loginEmailInput.fill('viewer_test@example.com');
      loginFlow.steps.push(await captureStep(page, 3, '填写登录邮箱', 'login-03-email.png'));

      const loginSendCode = await findClickable(page, [/send code/i, /send verification/i, /continue/i]);
      if (loginSendCode) {
        await loginSendCode.click();
        await page.waitForTimeout(2000);
        loginFlow.steps.push(await captureStep(page, 4, '点击 Send code', 'login-04-send-code.png'));
      }

      const loginCodeInputs = page.locator('input[type="text"], input[type="number"], input[inputmode="numeric"]');
      const lc = await loginCodeInputs.count();
      for (let i = 0; i < lc; i++) {
        const inp = loginCodeInputs.nth(i);
        if (await inp.isVisible()) await inp.fill(TEST_CODE[i] || TEST_CODE[0]);
      }
      loginFlow.steps.push(await captureStep(page, 5, `填写验证码 ${TEST_CODE}`, 'login-05-code.png'));
    }

    report.flows.push(loginFlow);

    // ========== Flow 3: Creator Login ==========
    const creatorFlow: FlowReport = { flow: 'Creator Login', steps: [], blockers: [] };
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await dismissModals(page);

    const creatorLoginBtn = page.getByRole('button', { name: /^log in$/i });
    if (await creatorLoginBtn.isVisible().catch(() => false)) {
      await safeClick(creatorLoginBtn);
      await page.waitForTimeout(1500);
      creatorFlow.steps.push(await captureStep(page, 1, '点击 Log in', 'creator-01-login.png'));
    }

    const creatorEmailInput = page.getByRole('textbox', { name: /email/i }).or(page.locator('input[type="email"]')).first();
    if (await creatorEmailInput.isVisible().catch(() => false)) {
      await creatorEmailInput.fill(CREATOR_EMAIL);
      creatorFlow.steps.push(await captureStep(page, 2, `填写 Creator 邮箱 ${CREATOR_EMAIL}`, 'creator-02-email.png'));

      const creatorSendCode = await findClickable(page, [/send code/i, /send verification/i, /continue/i]);
      if (creatorSendCode) {
        await creatorSendCode.click();
        await page.waitForTimeout(2000);
        creatorFlow.steps.push(await captureStep(page, 3, 'Send code', 'creator-03-send-code.png'));
      }

      const creatorCodeInputs = page.locator('input[type="text"], input[type="number"], input[inputmode="numeric"]');
      const cc = await creatorCodeInputs.count();
      for (let i = 0; i < cc; i++) {
        const inp = creatorCodeInputs.nth(i);
        if (await inp.isVisible()) await inp.fill(TEST_CODE[i] || TEST_CODE[0]);
      }

      const creatorVerify = await findClickable(page, [/verify/i, /continue/i, /log in/i, /sign in/i, /confirm/i]);
      if (creatorVerify) {
        await creatorVerify.click();
        await page.waitForTimeout(3000);
      }
      creatorFlow.steps.push(await captureStep(page, 4, `验证码 ${TEST_CODE} 并登录`, 'creator-04-logged-in.png'));
    }

    report.flows.push(creatorFlow);

    // ========== Flow 4: Post module (Creator) ==========
    const postFlow: FlowReport = { flow: 'Post module (Creator)', steps: [], blockers: [] };
    await page.waitForTimeout(2000);
    postFlow.steps.push(await captureStep(page, 1, 'Creator 登录后当前页面', 'post-01-after-login.png'));

    const createPostEntry = await findClickable(page, [
      /create post/i, /new post/i, /post/i, /create/i, /\+/i, /add/i, /write/i,
    ]);
    if (createPostEntry) {
      const entryText = await createPostEntry.textContent();
      await createPostEntry.click();
      await page.waitForTimeout(2000);
      postFlow.steps.push(await captureStep(page, 2, `点击创建帖子入口: ${entryText?.trim()}`, 'post-02-create-entry.png'));
    } else {
      postFlow.blockers.push('未找到创建帖子入口，尝试导航菜单');
      const navLinks = await page.getByRole('link').allTextContents();
      postFlow.blockers.push(`可见链接: ${navLinks.slice(0, 20).join(', ')}`);
      const navButtons = await page.getByRole('button').allTextContents();
      postFlow.blockers.push(`可见按钮: ${navButtons.slice(0, 20).join(', ')}`);
    }

    const postFormFields = await collectVisibleElements(page);
    postFlow.steps.push(await captureStep(page, 3, '创建帖子表单', 'post-03-form.png', [
      `表单元素数: ${postFormFields.length}`,
    ]));

    const publishBtn = await findClickable(page, [/publish/i, /post/i, /submit/i, /share/i, /send/i]);
    if (publishBtn) {
      const pubText = await publishBtn.textContent();
      const pubDisabled = await publishBtn.isDisabled().catch(() => false);
      postFlow.steps.push(await captureStep(page, 4, `发布按钮: "${pubText?.trim()}" disabled=${pubDisabled}`, 'post-04-publish-btn.png'));
    }

    const contentField = page.getByRole('textbox').or(page.locator('textarea, [contenteditable="true"]')).first();
    if (await contentField.isVisible().catch(() => false)) {
      await contentField.fill(`Playwright explore post ${Date.now()}`);
      postFlow.steps.push(await captureStep(page, 5, '填写帖子内容（不发布）', 'post-05-content-filled.png', ['未点击发布以避免创建真实帖子']));
    }

    const profileLink = await findClickable(page, [/profile/i, /my page/i, /dashboard/i, /home/i]);
    if (profileLink) {
      await profileLink.click();
      await page.waitForTimeout(2000);
      postFlow.steps.push(await captureStep(page, 6, '查看个人主页/帖子列表', 'post-06-profile.png'));
    }

    report.flows.push(postFlow);

    const outDir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'flow-exploration.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\n流程探索报告: ${outPath}`);
    console.log(`截图目录: ${SCREENSHOT_DIR}`);

    expect(report.flows.length).toBeGreaterThanOrEqual(1);
  });
});
