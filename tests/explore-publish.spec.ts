import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const CREATOR_EMAIL = 'haaaaaaaa@wegrowth.dev';
const TEST_CODE = '0124';
const DIR = path.join(process.cwd(), 'reports', 'explore-screenshots');

async function dismissAgeGate(page: import('@playwright/test').Page) {
  const over18 = page.getByText(/i'?m over 18/i).or(page.getByRole('button', { name: /over 18/i }));
  await over18.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null);
  if (await over18.first().isVisible().catch(() => false)) {
    await over18.first().click({ force: true });
    await page.waitForTimeout(2000);
  }
}

async function loginCreator(page: import('@playwright/test').Page) {
  await page.goto('/');
  await dismissAgeGate(page);
  await page.getByRole('button', { name: /^log in$/i }).click({ force: true });
  await page.waitForTimeout(1500);
  await page.getByText('Log in with Email', { exact: true }).locator('xpath=..').click({ force: true });
  await page.waitForTimeout(1000);
  await page.getByRole('textbox', { name: /email/i }).fill(CREATOR_EMAIL);
  await page.getByRole('button', { name: /send code/i }).click();
  await page.waitForTimeout(2000);
  const inputs = page.locator('input[type="text"], input[inputmode="numeric"]');
  for (let i = 0; i < 4; i++) await inputs.nth(i).fill(TEST_CODE[i]);
  await page.getByRole('button', { name: /next/i }).click();
  await page.waitForURL(/\/home/, { timeout: 30_000 });
}

test('Post 发帖流程探索', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(DIR, { recursive: true });
  const report: Record<string, unknown> = {};

  await loginCreator(page);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(DIR, 'publish-01-home.png'), fullPage: true });
  report.homeUrl = page.url();
  report.homeAria = await page.locator('body').ariaSnapshot();

  await page.locator('nav').getByText(/^(Post|Publish)$/, { exact: true }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(DIR, 'publish-02-create-modal.png'), fullPage: true });
  report.createModalAria = await page.locator('body').ariaSnapshot();

  await page.getByText('New Post', { exact: true }).click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(DIR, 'publish-03-newpost-form.png'), fullPage: true });
  report.publishUrl = page.url();
  report.publishAria = await page.locator('body').ariaSnapshot();
  report.publishFields = await page.locator('input:visible, textarea:visible, button:visible, [contenteditable="true"]').evaluateAll((els) =>
    els.map((el) => ({
      tag: el.tagName,
      type: (el as HTMLInputElement).type,
      placeholder: (el as HTMLInputElement).placeholder,
      text: el.textContent?.trim().slice(0, 100),
      ariaLabel: el.getAttribute('aria-label'),
      contentEditable: el.getAttribute('contenteditable'),
    }))
  );

  const content = page.locator('textarea, [contenteditable="true"]').first();
  if (await content.isVisible().catch(() => false)) {
    await content.fill('Playwright UI explore - not publishing');
    await page.screenshot({ path: path.join(DIR, 'publish-04-content-filled.png'), fullPage: true });
  }

  const publishBtn = page.getByRole('button', { name: /publish|post|share|submit/i });
  report.publishButtons = await publishBtn.allTextContents().catch(() => []);
  if (await publishBtn.count() > 0) {
    report.publishBtnDisabled = await publishBtn.first().isDisabled();
  }
  await page.screenshot({ path: path.join(DIR, 'publish-05-final.png'), fullPage: true });

  fs.writeFileSync(path.join(process.cwd(), 'reports', 'publish-exploration.json'), JSON.stringify(report, null, 2));
  expect(report.createModalAria).toBeTruthy();
});
