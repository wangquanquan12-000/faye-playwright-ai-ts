import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 站点探索测试 — 自动发现页面路由与可交互元素，输出报告供 Planner Agent 使用。
 * 运行: npm run explore
 */
test('探索 RM11 测试环境', async ({ page }) => {
  const report: Record<string, unknown> = {
    baseURL: process.env.BASE_URL || 'https://faye-test.link',
    exploredAt: new Date().toISOString(),
    pages: [] as unknown[],
  };

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const homeInfo = {
    url: page.url(),
    title: await page.title(),
    links: await page.locator('a[href]').evaluateAll((anchors) =>
      anchors
        .map((a) => ({
          text: (a as HTMLAnchorElement).innerText?.trim().slice(0, 80),
          href: (a as HTMLAnchorElement).href,
        }))
        .filter((l) => l.href && !l.href.startsWith('javascript:'))
        .slice(0, 50)
    ),
    buttons: await page.getByRole('button').allTextContents(),
    snapshot: await page.locator('body').ariaSnapshot(),
  };

  (report.pages as unknown[]).push({ name: 'homepage', ...homeInfo });

  const outDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'site-exploration.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  expect(await page.title()).toMatch(/RM11/i);
  console.log(`\n站点探索报告已保存: ${outPath}`);
});
