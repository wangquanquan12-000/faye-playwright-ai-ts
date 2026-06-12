import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';
import {
  clickPostNext,
  fillCaptionAndSubmitPost,
  generatePostCaption,
  getMediaUploadCount,
  MEDIA_UPLOAD_TIMEOUT_MS,
  openNewPostForm,
  selectEveryoneAccess,
  uploadPostMedia,
  waitForPostCaptionStep,
  waitForPostPublishSuccess,
} from '../../src/helpers/post';
import {
  assertVisualInspectionResults,
  inspectHomeSidebarUi,
  inspectPostSuccessUi,
  inspectPostDetailsUi,
  inspectPublishFormUi,
  type UiInspectionRunResult,
} from '../../src/helpers/ui-design';

/** 同条用例内多 scene：失败记录后继续，末尾统一断言 */
const VISUAL_CONTINUE = { continueOnFail: true } as const;

async function recordVisual(
  results: UiInspectionRunResult[],
  run: Promise<UiInspectionRunResult | void>
): Promise<void> {
  const result = await run;
  if (result) results.push(result);
}

/**
 * Post 相关页面视觉走查。
 * 需沿发帖路径导航至各场景，仅做 UI 断言；业务流程见 tests/post/post.spec.ts
 */
test.describe.configure({ timeout: MEDIA_UPLOAD_TIMEOUT_MS + 180_000, retries: 0 });

test.describe('@visual Post 页面视觉', () => {
  test('UI-POST 发帖三页视觉走查', async ({ page }, testInfo) => {
    const visualResults: UiInspectionRunResult[] = [];

    await test.step('UI-POST-01 发帖 Step1 表单', async () => {
      await openNewPostForm(page);
      await expect(page).toHaveURL(/\/publish\?post_id=/);
      await recordVisual(
        visualResults,
        inspectPublishFormUi(page, testInfo, VISUAL_CONTINUE)
      );
    });

    await test.step('UI-POST-02 Post Details', async () => {
      const uploaded = await uploadPostMedia(page);
      expect(uploaded.length).toBeGreaterThan(0);
      expect(await getMediaUploadCount(page)).toBeGreaterThan(0);

      await selectEveryoneAccess(page);
      await clickPostNext(page);
      await waitForPostCaptionStep(page);
      await recordVisual(
        visualResults,
        inspectPostDetailsUi(page, testInfo, VISUAL_CONTINUE)
      );
    });

    await test.step('UI-POST-03 发布成功页', async () => {
      const caption = generatePostCaption();
      console.log('UI走查 Caption:', caption);

      if (await page.getByRole('button', { name: /next/i }).isVisible().catch(() => false)) {
        const disabled = await page
          .getByRole('button', { name: /next/i })
          .isDisabled()
          .catch(() => true);
        if (!disabled) await clickPostNext(page);
      }

      await fillCaptionAndSubmitPost(page, caption);
      await waitForPostPublishSuccess(page);
      await recordVisual(
        visualResults,
        inspectPostSuccessUi(page, testInfo, VISUAL_CONTINUE)
      );
    });

    assertVisualInspectionResults(visualResults);
  });

  test('UI-POST-04 Home 侧栏', async ({ page }, testInfo) => {
    await page.goto('/home');
    await inspectHomeSidebarUi(page, testInfo);
  });
});
