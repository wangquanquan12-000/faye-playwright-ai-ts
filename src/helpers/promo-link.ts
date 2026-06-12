import { expect, type Locator, type Page } from '@playwright/test';
import { appNavigation } from './auth';
import { waitForPageLoadingComplete } from './page-ready';

/** Promo Link 生成 URL 格式（测试/生产域名兼容） */
export const PROMO_LINK_URL_PATTERN =
  /https?:\/\/[^/]+\/memberships\/promolink\/[A-Za-z0-9]+/i;

/** 视觉/流程走查固定 Campaign Name，便于 Active 卡片断言锚定 */
export const PROMO_LINK_TEST_CAMPAIGN_NAME = 'uitest';

const MONETIZATION_PAGE_URL = /\/user\/creator_tools|monetization/i;

/** Desktop Profile 页 Monetization 入口（mobile 上为 hidden，勿单独依赖） */
const PROFILE_MONETIZATION_ENTRY_XPATH =
  '//*[@id="scroll-container"]/div[1]/div[2]/div/div[1]/div[2]/div[1]/div[2]/div[1]';

/**
 * Profile 页右上角 Monetization 入口。
 *
 * 布局（自右向左）：Setting 图标（最右）→ Monetization 钱包图标（其左侧，显示 $0.00）。
 * 稳定锚点：`.head-bar .monetization-wrap` + `img[alt="Monetization"]`。
 * 点击后进入 `/user/creator_tools`（Monetization 页）。
 */
export function profileMonetizationEntry(page: Page) {
  const headBar = page.locator('.head-bar').first();
  return headBar
    .locator('.monetization-wrap')
    .filter({ has: headBar.getByRole('img', { name: 'Monetization' }) });
}

async function waitForMonetizationLanding(page: Page): Promise<void> {
  await expect(
    page.getByText('Monetization', { exact: true }).or(page.getByText('Membership Details', { exact: true })).first()
  ).toBeVisible({ timeout: 15_000 });
}

async function openMonetizationPage(page: Page): Promise<void> {
  if (MONETIZATION_PAGE_URL.test(page.url())) return;

  const entry = profileMonetizationEntry(page);
  if (await entry.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await entry.click({ force: true });
    const navigated = await page
      .waitForURL(MONETIZATION_PAGE_URL, { timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (!navigated) {
      // SPA 偶发不触发 URL 事件时，直接打开 Monetization 路由
      await page.goto('/user/creator_tools');
    }
    return;
  }

  const desktopEntry = page.locator(`xpath=${PROFILE_MONETIZATION_ENTRY_XPATH}`);
  if (await desktopEntry.isVisible({ timeout: 3000 }).catch(() => false)) {
    await desktopEntry.click({ force: true });
    return;
  }

  await page.goto('/user/creator_tools');
}

/** Profile 入口：Desktop 侧栏文字 + Mobile 底部导航图标/链接 */
export function navProfileButton(page: Page) {
  const nav = appNavigation(page);
  const labelled = nav.getByText('Profile', { exact: true });
  const profileHref = nav.locator('a[href*="/@"]');
  // Mobile 底部导航第 5 项为 Profile（Home、Notifications、Post、Messages、Profile）
  const mobileProfile = nav.locator(':scope > *').nth(4);
  return labelled.or(profileHref).or(mobileProfile);
}

/** 是否处于 Promo Link 空状态 */
export async function isPromoLinkEmpty(page: Page): Promise<boolean> {
  return page
    .getByText('No promo link yet.')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
}

/** Profile → Monetization */
export async function openMonetizationFromProfile(page: Page): Promise<void> {
  if (!/\/@|creator_tools|monetization/i.test(page.url())) {
    const profile = navProfileButton(page);
    const href = await profile.getAttribute('href').catch(() => null);
    if (href) {
      await page.goto(href);
    } else {
      // 测试环境右下角 vConsole 可能遮挡底部导航，force 点击兜底
      await profile.click({ force: true });
    }
    await waitForPageLoadingComplete(page);
  }

  await openMonetizationPage(page);
  await waitForPageLoadingComplete(page);
  await waitForMonetizationLanding(page);
}

/** Monetization → Promo Link 列表 */
export async function openPromoLinkFromMonetization(page: Page): Promise<void> {
  const promoEntry = page.getByText('Promo Link', { exact: true });
  await promoEntry.waitFor({ state: 'visible', timeout: 15_000 });
  await promoEntry.click();
  await waitForPageLoadingComplete(page);

  await expect(page.getByText('Promo Link', { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
}

/** 完整导航：已登录 → Promo Link 列表页 */
export async function openPromoLinkList(page: Page): Promise<void> {
  await openMonetizationFromProfile(page);
  await openPromoLinkFromMonetization(page);
}

/** 列表页 → New Promo Link 创建页 */
export async function openNewPromoLinkForm(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /^generate campaign$/i });
  await btn.waitFor({ state: 'visible', timeout: 15_000 });
  await btn.click();
  await waitForPageLoadingComplete(page);

  await expect(page.getByText('New Promo Link', { exact: true })).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * 按需求文档填写创建表单（Free Trail 默认路径）。
 * 必填：Campaign Type（默认 Free Trail）、Membership Plan（默认 1 Month）、Free Trial Duration（默认 7）
 * Campaign Name 固定为 {@link PROMO_LINK_TEST_CAMPAIGN_NAME}；Maximum Users / Available Until 不填写
 */
export async function fillNewPromoLinkWithDefaults(page: Page): Promise<void> {
  await expect(page.getByText('Campaign Type', { exact: true })).toBeVisible();

  const campaignName = page.getByPlaceholder(/spring sale/i);
  if (await campaignName.isVisible().catch(() => false)) {
    await campaignName.fill(PROMO_LINK_TEST_CAMPAIGN_NAME);
  }

  await expect(page.getByText(/free\s*trail/i).first()).toBeVisible();
  await expect(page.getByText(/1\s*month\s*membership/i).first()).toBeVisible();

  const freeDuration = page.locator('text=Free Trail Duration').locator('xpath=..').locator('input').first();
  if (await freeDuration.isVisible().catch(() => false)) {
    const val = await freeDuration.inputValue().catch(() => '');
    if (!val || val === '0') {
      await freeDuration.fill('7');
    }
  }

  const maxUsersLabel = page.getByText('Maximum Users (Optional)', { exact: true });
  if (await maxUsersLabel.isVisible().catch(() => false)) {
    const maxUsersInput = maxUsersLabel.locator('xpath=..').locator('input').first();
    if (await maxUsersInput.isVisible().catch(() => false)) {
      await maxUsersInput.fill('');
    }
  }
}

/** 提交创建 */
export async function submitPromoLinkGenerateCampaign(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /^generate campaign$/i });
  await btn.waitFor({ state: 'visible', timeout: 15_000 });
  await btn.click();
}

/** 等待创建成功页 */
export async function waitForPromoLinkCreatedPage(page: Page): Promise<void> {
  await page.getByText('Promo Link Created!', { exact: true }).waitFor({
    state: 'visible',
    timeout: 60_000,
  });
  await waitForPageLoadingComplete(page);
}

/** 获取成功页展示的 Promo Link 文本 */
export async function getPromoLinkCreatedUrlText(page: Page): Promise<string> {
  const linkLocator = page.locator('text=/memberships\\/promolink\\//i').first();
  await linkLocator.waitFor({ state: 'visible', timeout: 10_000 });
  return (await linkLocator.innerText()).trim();
}

/** 是否已在 Promo Link 列表页（非创建页/成功页） */
export async function isOnPromoLinkListPage(page: Page): Promise<boolean> {
  if (await page.getByText('Promo Link Created!', { exact: true }).isVisible().catch(() => false)) {
    return false;
  }
  if (await page.getByText('New Promo Link', { exact: true }).isVisible().catch(() => false)) {
    return false;
  }
  return page
    .getByText('Promo Link', { exact: true })
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);
}

/** 关闭创建成功页（不复制），返回 Promo Link 列表 */
export async function closePromoLinkCreatedPage(page: Page): Promise<void> {
  if (await isOnPromoLinkListPage(page)) {
    return;
  }

  const successHeading = page.getByText('Promo Link Created!', { exact: true });
  if (!(await successHeading.isVisible({ timeout: 2000 }).catch(() => false))) {
    return;
  }

  await page.goBack().catch(() => undefined);
  await waitForPageLoadingComplete(page);

  if (await page.getByText('New Promo Link', { exact: true }).isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.goBack().catch(() => undefined);
    await waitForPageLoadingComplete(page);
  }

  await expect(page.getByText('Promo Link', { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(successHeading).toBeHidden({ timeout: 5000 });
}

/** 第一张 Active 卡片内的 Copy Link */
export function firstActivePromoCardCopyLink(page: Page) {
  return page.getByRole('button', { name: /^copy link$/i }).first();
}

/** 含 {@link PROMO_LINK_TEST_CAMPAIGN_NAME} 主标题的 Active 卡片根节点 */
export function uitestPromoCard(page: Page): Locator {
  return page
    .getByText(PROMO_LINK_TEST_CAMPAIGN_NAME, { exact: true })
    .first()
    .locator(
      'xpath=ancestor::*[.//*[normalize-space(text())="Claims"] and .//button[contains(normalize-space(.),"Copy Link")]][1]'
    );
}

/** 卡片内 Claims / Clicks / Revenue 列下方的数值节点 */
export function promoCardStatValue(card: Locator, stat: 'Claims' | 'Clicks' | 'Revenue'): Locator {
  const label = card.getByText(stat, { exact: true });
  return label
    .locator('xpath=following-sibling::*[normalize-space(text())][1]')
    .or(label.locator('xpath=parent::*/*[normalize-space(text())][last()]'));
}

/** 卡片副标题（如 7 Days Free • 3 Months）；无副标题时不存在 */
export function promoCardSubtitle(card: Locator): Locator {
  return card.getByText(/\d+\s*Days?\s*Free|After\s*\d+%\s*off/i).first();
}

