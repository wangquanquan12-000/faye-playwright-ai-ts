import * as path from 'path';
import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';
import { testData } from '../../src/fixtures/test-data';
import {
  assertFirstFeedPostIsPublished,
  clickPostNext,
  clickViewPostAndGoHome,
  copyPostShareLink,
  fillCaptionAndSubmitPost,
  generatePostCaption,
  getMediaUploadCount,
  MEDIA_UPLOAD_TIMEOUT_MS,
  navPostButton,
  openNewPostForm,
  postShareLinkPattern,
  selectEveryoneAccess,
  uploadPostMedia,
  waitForPostCaptionStep,
  waitForPostPublishSuccess,
} from '../../src/helpers/post';

// 含 5min 媒体上传等待 + 登录与发帖流程；长流程不重试，避免失败后整用例再跑一遍
test.describe.configure({ timeout: MEDIA_UPLOAD_TIMEOUT_MS + 180_000, retries: 0 });

/**
 * 发帖是连续业务流程：同一会话、同一页面从打开发帖入口走到发布完成。
 * 使用 test.step 分步记录，避免每条 test() 重建浏览器上下文。
 */
test('Post 主流程', async ({ page }) => {
  let postCaption = '';

  await test.step('POST-01 Creator 打开发帖入口', async () => {
    await openNewPostForm(page);

    await expect(page).toHaveURL(/\/publish\?post_id=/);
    await expect(page.getByText('Image', { exact: true })).toBeVisible();
    await expect(page.getByText('Everyone', { exact: true })).toBeVisible();
  });

  await test.step('POST-02 发帖 Step1 点击 Image 上传图片并选择 Everyone', async () => {
    const uploaded = await uploadPostMedia(page);
    const count = await getMediaUploadCount(page);
    console.log(
      `本次上传 ${uploaded.length} 个文件 (${count}/10):`,
      uploaded.map((f) => path.basename(f)).join(', ')
    );
    expect(count).toBeGreaterThan(0);

    await selectEveryoneAccess(page);
    await clickPostNext(page); // 内含 upload incomplete 时 20s 重试，最长等待 5min
    await waitForPostCaptionStep(page);
  });

  await test.step('POST-03 发帖 Step2 填写文案并 Post 发布', async () => {
    postCaption = generatePostCaption();
    console.log('本次 Caption:', postCaption);

    if (await page.getByRole('button', { name: /next/i }).isVisible().catch(() => false)) {
      const nextDisabled = await page.getByRole('button', { name: /next/i }).isDisabled().catch(() => true);
      if (!nextDisabled) await clickPostNext(page);
    }

    await fillCaptionAndSubmitPost(page, postCaption);
    await waitForPostPublishSuccess(page);
  });

  await test.step('POST-04 发布成功页点击 Share 复制帖子链接', async () => {
    const shareLink = await copyPostShareLink(page);
    console.log('Share 链接:', shareLink);
    expect(shareLink).toMatch(postShareLinkPattern(testData.baseURL));
  });

  await test.step('POST-05 发布成功页点击 View Post 跳转 Home 并校验首条 Post', async () => {
    await clickViewPostAndGoHome(page);
    await assertFirstFeedPostIsPublished(page, postCaption, testData.creator.username);
    await expect(navPostButton(page)).toBeVisible();
  });
});
