import type { Page } from '@playwright/test';

export interface AIAction {
  action: 'click' | 'fill' | 'navigate' | 'assert' | 'wait' | 'press';
  target?: string;
  value?: string;
  description: string;
}

export interface AIAgentConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

/**
 * 基于自然语言的 AI UI 自动化 Agent。
 * 通过页面可访问性快照 + LLM 推理，将自然语言指令转化为 Playwright 操作。
 */
export class AIAgent {
  private config: Required<AIAgentConfig>;

  constructor(private page: Page, config: AIAgentConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      baseURL: config.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: config.model || process.env.OPENAI_MODEL || 'gpt-4o',
    };
  }

  async getPageContext(): Promise<string> {
    const snapshot = await this.page.locator('body').ariaSnapshot();
    const url = this.page.url();
    const title = await this.page.title();
    return JSON.stringify({ url, title, ariaSnapshot: snapshot }, null, 2);
  }

  async plan(instruction: string): Promise<AIAction[]> {
    if (!this.config.apiKey) {
      throw new Error('未配置 OPENAI_API_KEY，无法使用 AI Agent。请在 .env 中设置。');
    }

    const context = await this.getPageContext();
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `你是 Playwright UI 自动化专家，目标站点是 RM11 (https://faye-test.link)。
根据页面可访问性快照，将用户指令拆解为操作步骤。
返回 JSON: { "steps": [{ "action": "click|fill|navigate|assert|wait|press", "target": "元素描述或选择器", "value": "可选值", "description": "步骤说明" }] }
规则：
- target 优先使用 role+name 语义描述，如 "button Sign In"
- navigate 的 value 为完整 URL 或相对路径
- assert 的 value 为期望看到的文本
- 每步只做一件事`,
          },
          {
            role: 'user',
            content: `页面上下文:\n${context}\n\n用户指令: ${instruction}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API 调用失败: ${response.status} ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    return parsed.steps as AIAction[];
  }

  async execute(instruction: string): Promise<AIAction[]> {
    const steps = await this.plan(instruction);

    for (const step of steps) {
      await this.executeStep(step);
    }

    return steps;
  }

  private async executeStep(step: AIAction): Promise<void> {
    switch (step.action) {
      case 'navigate':
        await this.page.goto(step.value || '/');
        await this.page.waitForLoadState('networkidle');
        break;

      case 'click':
        await this.clickByDescription(step.target || step.description);
        break;

      case 'fill':
        await this.fillByDescription(step.target || '', step.value || '');
        break;

      case 'press':
        await this.page.keyboard.press(step.value || 'Enter');
        break;

      case 'wait':
        await this.page.waitForTimeout(Number(step.value) || 1000);
        break;

      case 'assert':
        await this.page.getByText(step.value || '').first().waitFor({ state: 'visible' });
        break;

      default:
        throw new Error(`未知操作: ${step.action}`);
    }
  }

  private async clickByDescription(description: string): Promise<void> {
    const locator = this.resolveLocator(description);
    await locator.first().click();
  }

  private async fillByDescription(description: string, value: string): Promise<void> {
    const locator = this.resolveLocator(description);
    await locator.first().fill(value);
  }

  private resolveLocator(description: string) {
    const lower = description.toLowerCase();

    if (lower.includes('button')) {
      const name = description.replace(/button\s*/i, '').trim();
      return this.page.getByRole('button', { name: new RegExp(name, 'i') });
    }
    if (lower.includes('link')) {
      const name = description.replace(/link\s*/i, '').trim();
      return this.page.getByRole('link', { name: new RegExp(name, 'i') });
    }
    if (lower.includes('input') || lower.includes('textbox') || lower.includes('field')) {
      const name = description.replace(/(input|textbox|field)\s*/i, '').trim();
      return this.page.getByRole('textbox', { name: new RegExp(name, 'i') });
    }

    return this.page.getByText(new RegExp(description, 'i'));
  }
}
