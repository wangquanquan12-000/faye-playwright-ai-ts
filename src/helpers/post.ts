import * as fs from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';

/**
 * 侧边栏发帖入口。
 * UI 已从 Publish 更名为 Post；测试环境可能仍显示 Publish，故两者兼容。
 */
export function navPostButton(page: Page) {
  return page.locator('nav').getByText(/^(Post|Publish)$/, { exact: true });
}

export function ensureTestImage(): string {
  const fixtureDir = path.join(process.cwd(), 'tests', 'fixtures');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const imgPath = path.join(fixtureDir, 'test-image.png');
  if (!fs.existsSync(imgPath)) {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(imgPath, png);
  }
  return imgPath;
}

export async function openNewPostForm(page: Page): Promise<void> {
  await navPostButton(page).click();
  await page.waitForTimeout(1500);
  await page.getByText('New Post', { exact: true }).click();
  await page.waitForURL(/\/publish\?post_id=/, { timeout: 30_000 });
}

export async function uploadPostImage(page: Page, imagePath?: string): Promise<void> {
  const file = imagePath || ensureTestImage();
  const fileInput = page.locator('input[type="file"]');
  if (await fileInput.count() > 0) {
    await fileInput.first().setInputFiles(file);
  } else {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10_000 }),
      page.getByText('Image', { exact: true }).click(),
    ]);
    await chooser.setFiles(file);
  }
  await page.waitForTimeout(3000);
}

export async function selectEveryoneAccess(page: Page): Promise<void> {
  const everyone = page.getByText('Everyone', { exact: true });
  if (await everyone.isVisible().catch(() => false)) {
    await everyone.click();
    await page.waitForTimeout(500);
  }
}

export async function clickPostNext(page: Page): Promise<void> {
  const next = page
    .getByRole('button', { name: /next/i })
    .or(page.locator('img[alt="Next"]').locator('xpath=..'));
  await next.first().waitFor({ state: 'visible', timeout: 15_000 });
  for (let i = 0; i < 30; i++) {
    if (!(await next.first().isDisabled().catch(() => true))) {
      await next.first().click({ force: true });
      await page.waitForTimeout(2500);
      return;
    }
    await page.waitForTimeout(300);
  }
  throw new Error('发帖页 Next 按钮不可用');
}

export async function fillCaptionAndSubmitPost(page: Page, caption: string): Promise<void> {
  const captionInput = page.locator('textarea:visible, [contenteditable="true"]:visible').first();
  await captionInput.waitFor({ state: 'visible', timeout: 20_000 });
  await captionInput.click();
  await captionInput.fill(caption);

  const submitPost = page.getByRole('button', { name: /^(post|publish)$/i });
  await submitPost.first().waitFor({ state: 'visible', timeout: 15_000 });
  for (let i = 0; i < 40; i++) {
    if (!(await submitPost.first().isDisabled().catch(() => true))) {
      await submitPost.first().click();
      await page.waitForTimeout(4000);
      return;
    }
    await page.waitForTimeout(300);
  }
  throw new Error('未找到可点击的 Post/Publish 提交按钮');
}
