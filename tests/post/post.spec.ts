import { test, expect } from '@playwright/test';
import { loginAsCreator } from '../../src/helpers/auth';
import { testData } from '../../src/fixtures/test-data';
import {
  clickPostNext,
  fillCaptionAndSubmitPost,
  navPostButton,
  openNewPostForm,
  selectEveryoneAccess,
  uploadPostImage,
} from '../../src/helpers/post';

const postCaption = `UI自动化发帖 ${Date.now()}`;

test.describe.serial('Post 主流程', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(180_000);
    await loginAsCreator(page);
  });

  test('POST-01 Creator 打开发帖入口', async ({ page }) => {
    await openNewPostForm(page);

    await expect(page).toHaveURL(/\/publish\?post_id=/);
    await expect(page.getByText('Image', { exact: true })).toBeVisible();
    await expect(page.getByText('Everyone', { exact: true })).toBeVisible();
  });

  test('POST-02 发帖 Step1 上传图片并选择 Everyone', async ({ page }) => {
    await openNewPostForm(page);
    await uploadPostImage(page);
    await selectEveryoneAccess(page);
    await clickPostNext(page);

    const body = await page.locator('body').innerText();
    const onNextStep =
      /caption|description|cover|post/i.test(body) ||
      (await page.getByRole('button', { name: /next|^post$/i }).count()) > 0;
    expect(onNextStep).toBeTruthy();
  });

  test('POST-03 发帖 Step2 填写文案并 Post 发布', async ({ page }) => {
    await openNewPostForm(page);
    await uploadPostImage(page);
    await selectEveryoneAccess(page);
    await clickPostNext(page);

    if (await page.getByRole('button', { name: /next/i }).isVisible().catch(() => false)) {
      const nextDisabled = await page.getByRole('button', { name: /next/i }).isDisabled().catch(() => true);
      if (!nextDisabled) await clickPostNext(page);
    }

    await fillCaptionAndSubmitPost(page, postCaption);
    await expect(page).toHaveURL(/\/home/, { timeout: 60_000 });
  });

  test('POST-04 Home Feed 查看已发布 Post', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText(testData.creator.username, { timeout: 15_000 });
    await expect(page.locator('body')).toContainText(postCaption, { timeout: 20_000 });
    await expect(navPostButton(page)).toBeVisible();
  });
});
