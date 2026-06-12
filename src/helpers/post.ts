import * as fs from 'fs';
import * as path from 'path';
import { expect, type Page } from '@playwright/test';
import { appNavigation } from './auth';
import { waitForPageLoadingComplete } from './page-ready';

export const TEST_MEDIA_DIR = path.join(process.cwd(), 'test-media');

/** 等待媒体上传完成的最长时间 */
export const MEDIA_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

/** 出现 upload incomplete 提示后，再次点击 Next 前的等待时间 */
const UPLOAD_RETRY_WAIT_MS = 20_000;

/** Caption 输入完成后、点击 Post 前的等待时间 */
const CAPTION_SUBMIT_DELAY_MS = 3_000;

const SELECT_ALL_KEY = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const MEDIA_UPLOAD_TIMEOUT_ERROR =
  '媒体未上传完成：已超过 5 分钟等待时间，请检查网络状况或减小图片体积后重试';

/**
 * 发帖入口：Desktop 侧栏文字 + Mobile 底部导航图标/链接。
 * UI 已从 Publish 更名为 Post；测试环境可能仍显示 Publish，故两者兼容。
 */
export function navPostButton(page: Page) {
  const nav = appNavigation(page);
  const labelled = nav.getByText(/^(Post|Publish)$/i);
  const publishHref = nav.locator('a[href*="/publish"], a[href*="publish"]');
  // Mobile 底部导航第 3 项为发帖（Home、Notifications、发帖、Messages、Profile）
  const mobileCompose = nav.locator(':scope > *').nth(2);
  return labelled.or(publishHref).or(mobileCompose);
}

/** 列出 test-media 目录下可用图片文件 */
export function listTestImageFiles(): string[] {
  fs.mkdirSync(TEST_MEDIA_DIR, { recursive: true });
  return fs
    .readdirSync(TEST_MEDIA_DIR)
    .filter((name) => !name.startsWith('.') && IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort()
    .map((name) => path.join(TEST_MEDIA_DIR, name));
}

/** @deprecated 请使用 listTestImageFiles */
export const listTestMediaFiles = listTestImageFiles;

/** 随机选取 1～9 张图片（不超过目录内实际图片数） */
export function pickRandomPostImages(): string[] {
  const all = listTestImageFiles();
  if (all.length === 0) {
    throw new Error(
      'test-media 中没有图片文件。请放入 .jpg / .jpeg / .png / .webp / .gif，详见 test-media/README.md'
    );
  }

  const count = Math.floor(Math.random() * Math.min(9, all.length)) + 1;
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** @deprecated 请使用 pickRandomPostImages */
export const pickRandomPostMedia = pickRandomPostImages;

/** 读取发帖页已上传媒体数量（解析 (n/10) 计数） */
export async function getMediaUploadCount(page: Page): Promise<number> {
  const text = await page.locator('body').innerText();
  const match = text.match(/\((\d+)\/10\)/);
  return match ? Number(match[1]) : 0;
}

function postNextButton(page: Page) {
  return page
    .getByRole('button', { name: /next/i })
    .or(page.locator('img[alt="Next"]').locator('xpath=..'));
}

/** 是否出现 “Please wait until upload completes” 类提示 */
export async function hasUploadIncompleteHint(page: Page): Promise<boolean> {
  return page
    .getByText(/please wait until upload complet/i)
    .first()
    .isVisible({ timeout: 1500 })
    .catch(() => false);
}

async function isOnCaptionStep(page: Page): Promise<boolean> {
  return page
    .locator('textarea:visible, [contenteditable="true"]:visible')
    .first()
    .isVisible({ timeout: 1500 })
    .catch(() => false);
}

/** 在截止时间前等待上传计数达到期望值 */
async function waitForUploadCount(
  page: Page,
  minCount: number,
  deadlineMs: number
): Promise<void> {
  while (Date.now() < deadlineMs) {
    const count = await getMediaUploadCount(page);
    if (count >= minCount) return;
    await page.waitForTimeout(2000);
  }
  throw new Error(MEDIA_UPLOAD_TIMEOUT_ERROR);
}

/** 点击 Image 按钮，通过本地文件选择器上传图片 */
async function uploadImagesViaImageButton(page: Page, files: string[]): Promise<void> {
  if (files.length === 0) return;

  const deadline = Date.now() + MEDIA_UPLOAD_TIMEOUT_MS;
  const before = await getMediaUploadCount(page);
  const imageBtn = page.getByText('Image', { exact: true });

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 15_000 }),
    imageBtn.click(),
  ]);
  await chooser.setFiles(files);

  await waitForUploadCount(page, before + files.length, deadline);
}

export async function openNewPostForm(page: Page): Promise<void> {
  await navPostButton(page).click();
  await page.waitForTimeout(1500);
  const newPost = page.getByText('New Post', { exact: true });
  if (await newPost.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newPost.click();
  }
  await page.waitForURL(/\/publish\?post_id=/, { timeout: 30_000 });
  await waitForPageLoadingComplete(page);
}

/** 从 test-media 随机选取 1～9 张图片，点击 Image 按钮上传 */
export async function uploadPostMedia(page: Page, files?: string[]): Promise<string[]> {
  const selected = (files ?? pickRandomPostImages()).filter((f) =>
    IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase())
  );

  if (selected.length === 0) {
    throw new Error('未选中任何图片文件，请检查 test-media 目录');
  }

  await uploadImagesViaImageButton(page, selected);

  const count = await getMediaUploadCount(page);
  if (count === 0) {
    throw new Error(
      `媒体未上传完成：界面计数仍为 0/10。已选: ${selected.map((f) => path.basename(f)).join(', ')}`
    );
  }

  return selected;
}

/** 等待进入发帖 Step2（文案/封面编辑） */
export async function waitForPostCaptionStep(page: Page): Promise<void> {
  await page
    .locator('textarea:visible, [contenteditable="true"]:visible')
    .first()
    .waitFor({ state: 'visible', timeout: 60_000 });
}

/** @deprecated 请使用 uploadPostMedia */
export async function uploadPostImage(page: Page, imagePath?: string): Promise<void> {
  await uploadPostMedia(page, imagePath ? [imagePath] : undefined);
}

export async function selectEveryoneAccess(page: Page): Promise<void> {
  const everyone = page.getByText('Everyone', { exact: true });
  if (await everyone.isVisible().catch(() => false)) {
    await everyone.click();
    await page.waitForTimeout(500);
  }
}

async function clickPostNextArrow(page: Page): Promise<void> {
  const next = postNextButton(page);
  await next.first().waitFor({ state: 'visible', timeout: 15_000 });
  for (let i = 0; i < 30; i++) {
    if (!(await next.first().isDisabled().catch(() => true))) {
      await next.first().click({ force: true });
      await page.waitForTimeout(1000);
      return;
    }
    await page.waitForTimeout(300);
  }
  throw new Error('发帖页 Next 箭头按钮不可用');
}

/**
 * 点击 Next 进入下一步。
 * 若提示 “Please wait until upload completes”，则等待 20s 后再次点击；
 * 全程最多等待 5 分钟，超时则抛出媒体未上传完成错误。
 */
export async function clickPostNext(page: Page): Promise<void> {
  const count = await getMediaUploadCount(page);
  if (count === 0) {
    throw new Error('尚未上传图片，无法点击 Next');
  }

  const deadline = Date.now() + MEDIA_UPLOAD_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await clickPostNextArrow(page);

    if (await isOnCaptionStep(page)) return;

    if (await hasUploadIncompleteHint(page)) {
      await page.waitForTimeout(UPLOAD_RETRY_WAIT_MS);
      continue;
    }

    // 可能仍在后台上传，稍等后重试
    await page.waitForTimeout(3000);
    if (await isOnCaptionStep(page)) return;

    if (await hasUploadIncompleteHint(page)) {
      await page.waitForTimeout(UPLOAD_RETRY_WAIT_MS);
      continue;
    }
  }

  throw new Error(MEDIA_UPLOAD_TIMEOUT_ERROR);
}

/** 生成发帖 Caption：uitest + 北京时间，如 uitest2026/06/08 18:15 */
export function generatePostCaption(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const dateStr = `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`;
  return `uitest${dateStr}`;
}

async function readCaptionInputValue(
  page: Page,
  captionInput: ReturnType<Page['locator']>
): Promise<string> {
  const tagName = await captionInput.evaluate((el) => el.tagName);
  if (tagName === 'TEXTAREA') {
    return captionInput.inputValue();
  }
  return (await captionInput.innerText()).trim();
}

/** 填写 Caption 并确认内容已写入，再等待 3s 后点击 Post */
export async function fillCaptionAndSubmitPost(page: Page, caption: string): Promise<void> {
  await fillPostCaption(page, caption);
  await submitPost(page);
}

export async function fillPostCaption(page: Page, caption: string): Promise<void> {
  const captionInput = page.locator('textarea:visible, [contenteditable="true"]:visible').first();
  await captionInput.waitFor({ state: 'visible', timeout: 20_000 });
  await captionInput.click();

  const tagName = await captionInput.evaluate((el) => el.tagName);
  if (tagName === 'TEXTAREA') {
    await captionInput.fill(caption);
  } else {
    await page.keyboard.press(SELECT_ALL_KEY);
    await page.keyboard.press('Backspace');
    await captionInput.pressSequentially(caption, { delay: 40 });
  }

  await expect
    .poll(async () => readCaptionInputValue(page, captionInput), { timeout: 10_000 })
    .toBe(caption);

  await page.waitForTimeout(CAPTION_SUBMIT_DELAY_MS);
}

export async function submitPost(page: Page): Promise<void> {
  const submitPostBtn = page.getByRole('button', { name: /^(post|publish)$/i });
  await submitPostBtn.first().waitFor({ state: 'visible', timeout: 15_000 });
  for (let i = 0; i < 40; i++) {
    if (!(await submitPostBtn.first().isDisabled().catch(() => true))) {
      await submitPostBtn.first().click();
      await page.waitForTimeout(4000);
      return;
    }
    await page.waitForTimeout(300);
  }
  throw new Error('未找到可点击的 Post/Publish 提交按钮');
}

/** 发布后停留在成功页，不会自动跳回 /home */
export async function waitForPostPublishSuccess(page: Page): Promise<void> {
  await page.waitForURL(/\/publish\/success/, { timeout: 60_000 });
  await page.getByText(/your (media|scheduel?).*(posted|set up) successfully/i).waitFor({
    state: 'visible',
    timeout: 15_000,
  });
}

/** 从发布成功页进入 Home Feed */
export async function goToHomeFromPublishSuccess(page: Page): Promise<void> {
  if (/\/home(?:\?|$)/.test(page.url())) return;

  const homeLink = page.locator('nav').getByRole('link', { name: /^home$/i });
  if (await homeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await homeLink.click();
  } else {
    await page.goto('/home');
  }
  await page.waitForURL(/\/home/, { timeout: 30_000 });
}

/** 发帖分享链接格式校验 */
export function postShareLinkPattern(baseURL: string): RegExp {
  const host = baseURL.replace(/\/$/, '');
  const escaped = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}/post\\?id=[^&]+&s=[^&]+&sc=post$`);
}

/** 发布成功页点击 Share，返回剪贴板中的帖子链接 */
export async function copyPostShareLink(page: Page): Promise<string> {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: /^share$/i }).click();
  await page.waitForTimeout(1000);

  return page.evaluate(async () => navigator.clipboard.readText());
}

/** 发布成功页点击 View Post，等待跳转 Home */
export async function clickViewPostAndGoHome(page: Page): Promise<void> {
  await page.getByRole('button', { name: /view post/i }).click();
  await page.waitForURL(/\/home/, { timeout: 30_000 });
}

/** Home Feed 主内容区（侧栏 nav 的兄弟节点，页面无 main 标签） */
export function homeFeedArea(page: Page) {
  return page.locator('nav').locator('xpath=ancestor::*[1]/following-sibling::*[1]');
}

/** 断言 Home 第一条帖子为刚发布的 Post */
export async function assertFirstFeedPostIsPublished(
  page: Page,
  caption: string,
  username: string
): Promise<void> {
  await page.waitForURL(/\/home/, { timeout: 30_000 });
  const feed = homeFeedArea(page);
  await feed.waitFor({ state: 'visible', timeout: 20_000 });

  const firstCaption = feed.locator('p').first();
  await expect(firstCaption).toHaveText(caption, { timeout: 20_000 });
  await expect(feed).toContainText(username, { timeout: 10_000 });
}
