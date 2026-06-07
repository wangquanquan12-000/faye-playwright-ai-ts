import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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

test('注册流程探索（不完成最终提交）', async ({ page }) => {
  test.setTimeout(180_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const findings: Record<string, unknown> = { steps: [] as unknown[] };

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await dismissAgeGate(page);
  await page.waitForTimeout(1500);

  // Sign up with Email
  const emailBtn = page.getByText('Sign up with Email', { exact: true }).locator('xpath=..');
  await emailBtn.click({ force: true });
  await page.waitForTimeout(1500);

  const testEmail = `explore_${Date.now()}@test.com`;
  const emailInput = page.locator('input').first();
  await emailInput.fill(testEmail);
  await page.getByRole('button', { name: /send code/i }).click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reg-valid-email-sent.png'), fullPage: true });
  (findings.steps as unknown[]).push({ step: 'email-sent', email: testEmail, url: page.url(), aria: await page.locator('body').ariaSnapshot() });

  // 验证码
  const inputs = page.locator('input[type="text"], input[type="number"], input[inputmode="numeric"], input[maxlength="1"]');
  const count = await inputs.count();
  if (count >= 4) {
    for (let i = 0; i < 4; i++) await inputs.nth(i).fill(TEST_CODE[i]);
  } else {
    const allInputs = page.locator('input:visible');
    for (let i = 0; i < Math.min(await allInputs.count(), 4); i++) {
      await allInputs.nth(i).fill(TEST_CODE[i] || '0');
    }
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reg-code-filled.png'), fullPage: true });

  const verifyBtn = page.getByRole('button', { name: /verify|continue|next|confirm/i });
  if (await verifyBtn.first().isVisible().catch(() => false)) {
    await verifyBtn.first().click();
    await page.waitForTimeout(3000);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reg-after-verify.png'), fullPage: true });
  (findings.steps as unknown[]).push({ step: 'after-verify', url: page.url(), aria: await page.locator('body').ariaSnapshot() });

  // 记录后续步骤所有可见字段
  const fields = await page.locator('input:visible, textarea:visible, select:visible, button:visible').evaluateAll((els) =>
    els.map((el) => ({
      tag: el.tagName,
      type: (el as HTMLInputElement).type,
      placeholder: (el as HTMLInputElement).placeholder,
      name: (el as HTMLInputElement).name,
      text: el.textContent?.trim().slice(0, 80),
      ariaLabel: el.getAttribute('aria-label'),
    }))
  );
  (findings.steps as unknown[]).push({ step: 'form-fields', fields, url: page.url() });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reg-onboarding.png'), fullPage: true });

  fs.writeFileSync(path.join(process.cwd(), 'reports', 'registration-exploration.json'), JSON.stringify(findings, null, 2));
  expect((findings.steps as unknown[]).length).toBeGreaterThan(0);
});
