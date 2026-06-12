import type { Page } from '@playwright/test';

export interface UiVisionAssertion {
  /** 自然语言视觉断言，交给 Midscene 基于截图判断 */
  assertion: string;
  /** 报告中的期望说明；不填时默认等于 assertion */
  expected?: string;
}

export interface UiVisionCheck {
  assertion: string;
  expected: string;
  actual: string;
  status: 'passed' | 'failed' | 'skipped';
  mark: string;
  source: 'midscene';
  error?: string;
}

export interface UiVisionOptions {
  assertions: UiVisionAssertion[];
}

function uiVisionEnabled(): boolean {
  return /^(1|true|yes)$/i.test(process.env.UI_VISION ?? '');
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isMissingModelConfig(message: string): boolean {
  return /model configuration is incomplete|model name .* required|api key .* required|missing .*key/i.test(message);
}

function skippedForConfig(item: UiVisionAssertion, message: string): UiVisionCheck {
  return {
    assertion: item.assertion,
    expected: item.expected ?? item.assertion,
    actual: `Midscene 配置缺失，跳过视觉辅助检查：${message}`,
    status: 'skipped',
    mark: '',
    source: 'midscene',
  };
}

/**
 * 可选视觉语义检查：只在 UI_VISION=1 时启用。
 *
 * 设计原则：
 * - Midscene 只作为截图语义辅助，不替代确定性 Token 断言。
 * - 失败只写入 visionChecks[]，第一阶段不影响用例 pass/fail。
 * - 默认 domIncluded=false，避免重新引入 DOM 语义误判；需要时可后续按 scene 精细化。
 */
export async function runVisionInspection(
  page: Page,
  options?: UiVisionOptions
): Promise<UiVisionCheck[]> {
  if (!options?.assertions?.length) return [];

  if (!uiVisionEnabled()) {
    return [];
  }

  let agent: { aiAssert: (assertion: string, errorMsg?: string, opts?: object) => Promise<void> };
  try {
    const midscene = await import('@midscene/web/playwright');
    agent = new midscene.PlaywrightAgent(page, {
      waitForNetworkIdleTimeout: 1000,
    });
  } catch (error) {
    const actual = `Midscene 加载失败：${normalizeError(error)}`;
    return options.assertions.map((item) => ({
      assertion: item.assertion,
      expected: item.expected ?? item.assertion,
      actual,
      status: 'failed',
      mark: '🔴 FAILED',
      source: 'midscene',
      error: actual,
    }));
  }

  const checks: UiVisionCheck[] = [];
  for (const item of options.assertions) {
    try {
      await agent.aiAssert(item.assertion, `Midscene 视觉断言失败：${item.assertion}`, {
        screenshotIncluded: true,
        domIncluded: false,
      });
      checks.push({
        assertion: item.assertion,
        expected: item.expected ?? item.assertion,
        actual: 'Midscene 基于截图判断通过',
        status: 'passed',
        mark: '',
        source: 'midscene',
      });
    } catch (error) {
      const message = normalizeError(error);
      if (isMissingModelConfig(message)) {
        checks.push(skippedForConfig(item, message));
        continue;
      }
      checks.push({
        assertion: item.assertion,
        expected: item.expected ?? item.assertion,
        actual: message,
        status: 'failed',
        mark: '🔴 FAILED',
        source: 'midscene',
        error: message,
      });
    }
  }

  return checks;
}
