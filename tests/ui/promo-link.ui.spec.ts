import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';
import {
  closePromoLinkCreatedPage,
  fillNewPromoLinkWithDefaults,
  isPromoLinkEmpty,
  openNewPromoLinkForm,
  openPromoLinkList,
  submitPromoLinkGenerateCampaign,
  waitForPromoLinkCreatedPage,
} from '../../src/helpers/promo-link';
import {
  assertVisualInspectionResults,
  inspectPromoLinkActiveUi,
  inspectPromoLinkCreatedUi,
  inspectPromoLinkEmptyUi,
  inspectPromoLinkNewDefaultUi,
  type UiInspectionRunResult,
} from '../../src/helpers/ui-design';

const VISUAL_CONTINUE = { continueOnFail: true } as const;

async function recordVisual(
  results: UiInspectionRunResult[],
  run: Promise<UiInspectionRunResult | void>
): Promise<void> {
  const result = await run;
  if (result) results.push(result);
}

/**
 * Promo Link 视觉走查（@visual）。
 * UI 图：design-refs/promo-link/
 * 需求：specs/features/promo-link-requirements.md
 */
test.describe.configure({ timeout: 120_000, retries: 0 });

test.describe('@visual Promo Link 页面视觉', () => {
  test('UI-PROMO 各场景走查', async ({ page }, testInfo) => {
    const visualResults: UiInspectionRunResult[] = [];

    await openPromoLinkList(page);
    const startedEmpty = await isPromoLinkEmpty(page);

    await test.step('UI-PROMO-01 Active 列表入口', async () => {
      if (!startedEmpty) {
        await expect(page.getByText('Active', { exact: true })).toBeVisible();
      } else {
        console.log('账号为空，Active 卡片走查延至创建 uitest 后');
      }
    });

    await test.step('UI-PROMO-02 空列表页 promo-link-empty', async () => {
      if (startedEmpty) {
        await recordVisual(
          visualResults,
          inspectPromoLinkEmptyUi(page, testInfo, VISUAL_CONTINUE)
        );
      } else {
        testInfo.annotations.push({
          type: 'skip-reason',
          description: '账号已有 Promo Link，无法展示空态；请使用无 link 的 Creator 账号复测空态走查',
        });
        console.log('跳过 promo-link-empty：账号非空');
      }
    });

    await test.step('UI-PROMO-03 创建页 new-promo-link-default', async () => {
      if (!(await page.getByText('New Promo Link', { exact: true }).isVisible().catch(() => false))) {
        await openNewPromoLinkForm(page);
      }
      await expect(page.getByText('New Promo Link', { exact: true })).toBeVisible();
      await recordVisual(
        visualResults,
        inspectPromoLinkNewDefaultUi(page, testInfo, VISUAL_CONTINUE)
      );
    });

    await test.step('UI-PROMO-04 创建成功页 promo-link-created', async () => {
      await fillNewPromoLinkWithDefaults(page);
      await submitPromoLinkGenerateCampaign(page);
      await waitForPromoLinkCreatedPage(page);
      await recordVisual(
        visualResults,
        inspectPromoLinkCreatedUi(page, testInfo, VISUAL_CONTINUE)
      );
    });

    await test.step('UI-PROMO-05 Active 非空列表（uitest 卡片）', async () => {
      await closePromoLinkCreatedPage(page);
      await expect(page.getByText('Active', { exact: true })).toBeVisible();
      await expect(page.getByText('uitest', { exact: true }).first()).toBeVisible();
      await recordVisual(
        visualResults,
        inspectPromoLinkActiveUi(page, testInfo, VISUAL_CONTINUE)
      );
    });

    assertVisualInspectionResults(visualResults);
  });
});
