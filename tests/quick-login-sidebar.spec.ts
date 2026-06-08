import * as fs from 'fs';
import * as path from 'path';
import { creatorTest as test } from '../src/fixtures/auth-fixture';

const OUT = path.join(process.cwd(), 'reports', 'quick-sidebar-probe.json');

test('login + sidebar probe', async ({ page }) => {
  test.setTimeout(120_000);
  const ariaFull = await page.locator('body').ariaSnapshot();

  const nav = page.locator('nav').first();
  const aside = page.locator('aside').first();
  const sidebar = page.locator('[class*="sidebar" i], [data-testid*="sidebar" i]').first();

  let sidebarLocator = nav;
  if (await aside.isVisible().catch(() => false)) sidebarLocator = aside;
  else if (await sidebar.isVisible().catch(() => false)) sidebarLocator = sidebar;

  const sidebarText = await sidebarLocator.innerText().catch(() => '');
  const sidebarAria = await sidebarLocator.ariaSnapshot().catch(() => '');

  const selectorResults: Record<string, { count: number; visible: boolean; text?: string }> = {};

  async function probe(name: string, loc: ReturnType<typeof page.locator>) {
    const count = await loc.count();
    let visible = false;
    let text = '';
    if (count > 0) {
      visible = await loc.first().isVisible().catch(() => false);
      text = (await loc.first().textContent().catch(() => '')) || '';
    }
    selectorResults[name] = { count, visible, text: text.trim().slice(0, 80) };
  }

  await probe('nav exact Post', page.locator('nav').getByText('Post', { exact: true }));
  await probe('nav role link Post', page.locator('nav').getByRole('link', { name: 'Post' }));
  await probe('nav role button Post', page.locator('nav').getByRole('button', { name: 'Post' }));
  await probe('getByText Post exact', page.getByText('Post', { exact: true }));
  await probe('getByRole link Post', page.getByRole('link', { name: /^Post$/i }));
  await probe('getByRole button Post', page.getByRole('button', { name: /^Post$/i }));
  await probe('nav Publish exact', page.locator('nav').getByText('Publish', { exact: true }));
  await probe('getByText Publish', page.getByText('Publish', { exact: true }));
  await probe('aria-label post', page.locator('[aria-label*="post" i]'));
  await probe('aria-label publish', page.locator('[aria-label*="publish" i]'));

  const bodyText = await page.locator('body').innerText();
  const bodyHasPost = /\bPost\b/.test(bodyText);
  const bodyHasPublish = /\bPublish\b/.test(bodyText);

  const working = Object.entries(selectorResults)
    .filter(([, v]) => v.visible && v.count > 0)
    .map(([k]) => k);

  const payload = {
    url: page.url(),
    bodyHasPost,
    bodyHasPublish,
    sidebarText,
    sidebarAria,
    selectorResults,
    workingSelectors: working,
    ariaFull,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log('=== SIDEBAR TEXT ===');
  console.log(sidebarText);
  console.log('=== WORKING SELECTORS ===');
  console.log(JSON.stringify(working, null, 2));
  console.log('=== SELECTOR RESULTS ===');
  console.log(JSON.stringify(selectorResults, null, 2));
  console.log('=== ARIA FULL ===');
  console.log(ariaFull);
});
