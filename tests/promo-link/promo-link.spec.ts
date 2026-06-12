import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';
import {
  closePromoLinkCreatedPage,
  fillNewPromoLinkWithDefaults,
  firstActivePromoCardCopyLink,
  getPromoLinkCreatedUrlText,
  isPromoLinkEmpty,
  openNewPromoLinkForm,
  openPromoLinkList,
  PROMO_LINK_TEST_CAMPAIGN_NAME,
  PROMO_LINK_URL_PATTERN,
  submitPromoLinkGenerateCampaign,
  waitForPromoLinkCreatedPage,
} from '../../src/helpers/promo-link';

test.describe.configure({ timeout: 120_000, retries: 0 });

/**
 * Promo Link 主流程（@flow）。
 * 需求：specs/features/promo-link-requirements.md
 * 视觉走查：tests/ui/promo-link.ui.spec.ts
 *
 * 前置：Creator 已登录（creatorTest）。
 * PROMO-01 空态：若账号已有 Promo Link，跳过空态断言并继续后续创建流程。
 */
test.describe('@flow Promo Link 业务流程', () => {
  test('PROMO 主流程：空页 → 创建 → 成功 → Active 列表', async ({ page }) => {
    await test.step('PROMO-01 打开 Promo Link 列表（空页面）', async () => {
      await openPromoLinkList(page);

      if (await isPromoLinkEmpty(page)) {
        await expect(page.getByText('No promo link yet.', { exact: true })).toBeVisible();
        await expect(page.getByText(/you can create a new promo link/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /^generate campaign$/i })).toBeVisible();
      } else {
        console.log('当前账号已有 Promo Link，跳过空态断言');
        await expect(page.getByText('Active', { exact: true })).toBeVisible();
      }
    });

    await test.step('PROMO-02 创建 Promo Link（Free Trail 默认字段）', async () => {
      await openNewPromoLinkForm(page);

      await expect(page.getByText('New Promo Link', { exact: true })).toBeVisible();
      await expect(
        page.getByText(/this discount can only be claimed once per user through this promo link/i)
      ).toBeVisible();

      await fillNewPromoLinkWithDefaults(page);
      await submitPromoLinkGenerateCampaign(page);
    });

    await test.step('PROMO-03 创建成功页', async () => {
      await waitForPromoLinkCreatedPage(page);

      await expect(page.getByText('Promo Link Created!', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /^copy link$/i })).toBeVisible();

      const linkText = await getPromoLinkCreatedUrlText(page);
      expect(linkText).toMatch(PROMO_LINK_URL_PATTERN);
      console.log('创建的 Promo Link:', linkText);
    });

    await test.step('PROMO-04 查看 Promo Link 非空 Active 列表', async () => {
      await closePromoLinkCreatedPage(page);

      await expect(page.getByText('Promo Link', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Active', { exact: true })).toBeVisible();
      await expect(page.getByText('Claims', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Clicks', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Revenue', { exact: true }).first()).toBeVisible();
      await expect(page.getByText(PROMO_LINK_TEST_CAMPAIGN_NAME, { exact: true }).first()).toBeVisible();
      await expect(firstActivePromoCardCopyLink(page)).toBeVisible();
      await expect(page.getByRole('button', { name: /^generate campaign$/i })).toBeVisible();
    });
  });
});
