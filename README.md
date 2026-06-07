# RM11 AI UI 自动化 (Playwright + TypeScript)

> 项目路径: `/Users/majing/circles/rm11-AICode/faye-playwright-ai-ts`
> Python 版本见: `/Users/majing/circles/rm11-AICode/faye-playwright-ai-python`

针对 [faye-test.link](https://faye-test.link/) 测试环境的 AI 驱动 UI 自动化框架，基于 [Playwright Test Agents](https://playwright.dev/docs/test-agents)。

## 功能

- **Playwright Test Agents** — Planner / Generator / Healer 三件套
- **自然语言驱动** — 用中文/英文描述测试步骤，AI 自动执行
- **站点探索** — 自动扫描页面结构，生成探索报告
- **多设备** — 支持 Desktop Chrome 与移动端

## 快速开始

```bash
# 1. 安装依赖
npm install
PLAYWRIGHT_BROWSERS_PATH=./browsers npx playwright install chromium

# 2. 配置环境变量
cp .env.example .env

# 3. 运行基础测试
npm test

# 4. 初始化 AI Agents（可选）
npm run init-agents
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm test` | 运行全部测试 |
| `npm run test:headed` | 有头模式运行 |
| `npm run test:ui` | Playwright UI 模式 |
| `npm run test:ai` | 运行 AI 自然语言测试 |
| `npm run explore` | 探索站点并生成报告 |
| `npm run init-agents` | 初始化 Planner/Generator/Healer |
| `npm run codegen` | 录制操作生成代码 |

## 项目结构

```
faye-playwright-ai-ts/
├── playwright.config.ts
├── tests/
│   ├── seed.spec.ts
│   ├── homepage.spec.ts
│   ├── explore-site.spec.ts
│   ├── auth/login.spec.ts
│   └── ai/natural-language.spec.ts
├── src/
│   ├── ai/ai-agent.ts
│   └── fixtures/
└── specs/
```
