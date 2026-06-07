import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TEST_CODE = '0124';
const REPORT = path.join(process.cwd(), 'reports', 'fresh-onboarding-exploration.json');

test('Fresh email onboarding 步骤探索', async ({ page }) => {
  test.setTimeout(180_000);
  const email = `UItest_fresh_${Date.now()}@wegrowth.dev`;
  const steps: Record<string, unknown>[] = [];

  const snap = async (name: string) => {
    const aria = await page.locator('body').ariaSnapshot().catch(() => '');
    const inputs = await page.locator('input:visible, textarea:visible, select:visible').evaluateAll((els) =>
      els.map((el) => ({
        tag: el.tagName,
        type: (el as HTMLInputElement).type,
        placeholder: (el as HTMLInputElement).placeholder,
        selector: (el as HTMLInputElement).placeholder
          ? `input[placeholder="${(el as HTMLInputElement).placeholder}"]`
          : undefined,
      }))
    );
    const buttons = await page.getByRole('button').evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLElement).offsetParent)
        .map((el) => ({
          text: el.textContent?.trim().slice(0, 80),
          disabled: (el as HTMLButtonElement).disabled,
          selector: `getByRole('button', { name: /${el.textContent?.trim().slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/i })`,
        }))
    );
    steps.push({ name, url: page.url(), hash: new URL(page.url()).hash, aria, inputs, buttons });
  };

  await page.goto('/');
  const over18 = page.getByText(/i'?m over 18/i);
  if (await over18.first().isVisible({ timeout: 8000 }).catch(() => false)) {
    await over18.first().click({ force: true });
    await page.waitForTimeout(2000);
  }

  await page.getByText('Sign up with Email', { exact: true }).locator('xpath=..').click({ force: true });
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('button', { name: /send code/i }).click();
  await page.waitForFunction(() => location.hash === '#step_3', { timeout: 20_000 });

  const codeInputs = page.locator('input[type="text"]:visible, input[type="tel"]:visible');
  for (let i = 0; i < 4; i++) await codeInputs.nth(i).fill(TEST_CODE[i]);
  const next = page.getByRole('button', { name: /^next$/i });
  for (let i = 0; i < 30; i++) {
    if (!(await next.isDisabled().catch(() => true))) {
      await next.click();
      break;
    }
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(3000);
  await snap('after-verify');

  for (let s = 0; s < 10; s++) {
    if (/\/home/.test(page.url())) break;
    await snap(`onboarding-${s}`);

    const mm = page.locator('input[placeholder="MM"]');
    if (await mm.isVisible().catch(() => false)) {
      await mm.fill('06');
      await page.locator('input[placeholder="DD"]').fill('07');
      await page.locator('input[placeholder="YYYY"]').fill('1995');
    }
    const uname = page.locator('input[placeholder*="name" i], input[placeholder*="user" i]').first();
    if (await uname.isVisible().catch(() => false)) {
      await uname.fill(`uitest_${Date.now().toString().slice(-6)}`);
    }
    const skip = page.getByRole('button', { name: /skip/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(2000);
      continue;
    }
    const viewer = page.getByText(/viewer|fan/i).first();
    if (await viewer.isVisible().catch(() => false)) await viewer.click();
    const nxt = page.getByRole('button', { name: /next|continue|confirm|done|finish|get started/i }).first();
    if (await nxt.isVisible().catch(() => false) && !(await nxt.isDisabled().catch(() => true))) {
      await nxt.click();
      await page.waitForTimeout(2500);
    } else break;
  }

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify({ email, steps }, null, 2));
});
