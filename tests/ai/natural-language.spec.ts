import { test, expect } from '../../src/fixtures/ai-fixture';

/**
 * 自然语言驱动的 AI UI 自动化示例。
 * 需要配置 OPENAI_API_KEY 后运行: npm run test:ai
 */
test.describe('AI 自然语言自动化', () => {
  test.skip(!process.env.OPENAI_API_KEY, '需要配置 OPENAI_API_KEY');

  test('用自然语言验证首页', async ({ page, ai }) => {
    await page.goto('/');

    const steps = await ai.execute('确认页面标题包含 RM11，并检查页面已正常加载');

    expect(steps.length).toBeGreaterThan(0);
    await expect(page).toHaveTitle(/RM11/i);
  });
});
