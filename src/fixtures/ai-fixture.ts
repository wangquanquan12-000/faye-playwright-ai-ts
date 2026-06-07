import { test as base } from '@playwright/test';
import { AIAgent } from '../ai/ai-agent';

type AIFixtures = {
  ai: AIAgent;
};

export const test = base.extend<AIFixtures>({
  ai: async ({ page }, use) => {
    const agent = new AIAgent(page);
    await use(agent);
  },
});

export { expect } from '@playwright/test';
