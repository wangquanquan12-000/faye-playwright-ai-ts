import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';
import { navPostButton } from '../../src/helpers/post';
import { inspectHomeSidebarUi } from '../../src/helpers/ui-design';

test.describe('@visual Home 侧栏视觉', () => {
  test('UI-HOME-01 已登录 Creator Home 侧栏', async ({ page }, testInfo) => {
    await expect(page).toHaveURL(/\/home/);
    await expect(navPostButton(page)).toBeVisible({ timeout: 15_000 });
    await inspectHomeSidebarUi(page, testInfo);
  });
});
