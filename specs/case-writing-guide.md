# RM11 自动化用例编写规范

> **适用范围**：`faye-playwright-ai-ts` 全部 Playwright 用例  
> **测试环境**：`https://faye-test.link`（`BASE_URL`）  
> **协作模式**：由业务方提供路径、规则、断言；AI/开发按本规范落地代码  
> **当前阶段**：优先保证用例**结构合格、逻辑可跑通**；全量 CI 执行可后续开启

---

## 1. 用例分层

| 类型 | 标签 | 目录 | 职责 | 禁止 |
|------|------|------|------|------|
| **业务流程** | `@flow` | `tests/auth/`、`tests/post/` 等 | 功能路径、业务规则、数据/跳转断言 | 内嵌全量 UI 走查 |
| **视觉走查** | `@visual` | `tests/ui/` | 颜色/字号/字重/渐变/溢出/对齐 | 重复写完整业务发布链路（除非导航需要） |
| **站点探索** | — | `tests/explore*.spec.ts`（后续可迁至 `tests/explore/`） | 发现页面结构、补用例草稿 | 作为 CI 门禁、替代 `@flow` |
| **登录/注册专测** | `@flow` | `tests/auth/*-login*.spec.ts` 等 | 显式验证登录/注册流程 | 使用 `creatorTest` 复用态 |

```bash
npm run test:flow      # @flow 业务用例（desktop chromium）
npm run test:visual    # tests/ui/ @visual（mobile-chrome，对齐移动端 UI 图）
npm run auth:seed      # 预生成 .auth/creator.json（可选）
AUTH_REFRESH=1 npm run test:flow -- ...   # 强制重登
```

> **设备**：`design-refs/` 均为移动端设计稿；`@visual` 必须在 **mobile-chrome** 执行，PC 自适应布局不能作为视觉比对基准。

---

## 2. 用例 ID 与命名

### 2.1 ID 规则

```
{模块}-{序号}
```

| 模块前缀 | 含义 | 示例 |
|----------|------|------|
| `AUTH` | 认证/注册 | `AUTH-01` |
| `POST` | 发帖 | `POST-01` |
| `HOME` | 首页/Feed | `HOME-01` |
| `UI-AGE` | 视觉-年龄门 | `UI-AGE-01` |
| `UI-POST` | 视觉-发帖 | `UI-POST-01` |
| `UI-HOME` | 视觉-Home | `UI-HOME-01` |

- 序号从 `01` 起，按主流程顺序递增  
- 一个 `test()` 可包含多个 `test.step()`，step 名须带用例 ID（如 `POST-01 Creator 打开发帖入口`）

### 2.2 文件命名

```
tests/{模块}/{模块}.spec.ts        # @flow
tests/ui/{模块}.ui.spec.ts         # @visual
```

---

## 3. 需求输入模板（业务方 → 用例编写）

每次新增或修改用例，请尽量按下列格式提供信息（可复制到 Issue / 聊天）：

```text
【用例类型】flow / visual
【用例 ID】如 POST-02（可选，未指定则由编写方分配）
【模块】发帖 / 订阅 / 消息 …
【角色】Creator / Viewer / 未登录
【前置条件】是否已登录、是否需要特定数据
【到达路径】逐步操作（从已知起点到目标页）
【业务规则】冷却时间、权限、必填、边界条件
【断言清单】
  - 步骤 N：期望 URL / 可见文案 / 元素状态 / 数据
【是否允许真实提交】是 / 否（测试环境是否落库）
【UI 图】（仅 visual 必填）见 design-refs/{功能}/ 下文件名
【备注】与旧用例关系、P0/P1、是否阻塞发布
```

---

## 4. 登录态规则（必须遵守）

### 4.1 默认：复用 Creator 会话

除**登录/注册专用用例**外，业务与视觉用例一律使用 `creatorTest`：

```ts
import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';

test.describe('@flow 某模块', () => {
  test('XXX-01 用例标题', async ({ page }) => {
    // page 已带 storageState；fixture 内 ensureCreatorSession 校验 /home
  });
});
```

- Worker 内登录**一次**，缓存 `.auth/creator.json`  
- **禁止**每条用例 `clearAuthStorage` + 重新发验证码  
- Token 过期：`ensureCreatorSession` 自动重登  
- 强制重登：`AUTH_REFRESH=1`

### 4.2 登录/注册专测

```ts
import { test, expect } from '@playwright/test';
import { loginAsCreator, resetBrowserSession } from '../../src/helpers/auth';

test('AUTH-01 Creator 邮箱登录', async ({ page }) => {
  await resetBrowserSession(page);
  await loginAsCreator(page);
  await expect(page).toHaveURL(/\/home/);
});
```

### 4.3 Viewer / 新注册用户

- 使用 `registerViewer` + 独立 storage 或专用 explore 用例  
- 勿与 Creator 缓存混用同一 `storageState` 文件

---

## 5. @flow 业务流程用例规范

### 5.1 结构要求

```ts
test.describe('@flow Post 业务流程', () => {
  test('POST 主流程', async ({ page }) => {
    await test.step('POST-01 步骤名', async () => {
      // 操作 + 断言
    });
    await test.step('POST-02 …', async () => { ... });
  });
});
```

- 使用 `test.step` 分段，一步骤一屏关键断言  
- 复杂导航、上传、等待逻辑放在 `src/helpers/`，**禁止**在 spec 内复制粘贴登录/验证码逻辑  
- 长流程（含媒体上传）在 `describe` 级配置 `timeout`，上传类 `retries: 0`

### 5.2 断言原则

| 级别 | 说明 | 示例 |
|------|------|------|
| **强断言（必须）** | 阻塞主流程 | `toHaveURL`、`toBeVisible` 关键按钮、成功文案 |
| **弱断言（可选）** | 辅助日志 | `console.log` 上传文件列表、Share 链接 |
| **禁止** | 脆弱实现细节 | 依赖 DOM 层级 xpath、未文档化的 class |

### 5.3 Helper 边界

| 领域 | 文件 | 职责 |
|------|------|------|
| 登录/会话 | `src/helpers/auth.ts` | 18+、验证码、onboarding、`creatorTest` 配套 |
| 发帖 | `src/helpers/post.ts` | 打开发帖、上传、Caption、发布成功、Feed 校验 |
| 页面就绪 | `src/helpers/page-ready.ts` | 全屏 loading 等待 |
| 视觉走查 | `src/helpers/ui-inspection.ts` | **不在 @flow 中调用**（除非团队明确约定） |

### 5.4 示例参考

- 发帖主流程：`tests/post/post.spec.ts`  
- 年龄门/登录：`tests/auth/`

---

## 6. @visual 视觉走查用例规范

### 6.1 与 @flow 的关系

- 视觉用例**必须能到达目标页面**，但不要求该功能已有完整业务回归  
- 导航优先复用 `post.ts` / `auth.ts` 中已有 helper  
- 一个 UI 页面对应一个 `scene`（见 `specs/ui-scene-workflow.md`）

```ts
import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';
import { inspectPublishFormUi } from '../../src/helpers/ui-design';
import { openNewPostForm } from '../../src/helpers/post';

test.describe('@visual Post 页面视觉', () => {
  test('UI-POST-01 发帖 Step1 表单', async ({ page }, testInfo) => {
    await openNewPostForm(page);
    await expect(page).toHaveURL(/\/publish\?post_id=/);
    await inspectPublishFormUi(page, testInfo);
  });
});
```

### 6.2 走查产出（按执行隔离）

每次执行生成独立子文件夹 `reports/ui-defects/<时间戳>/`，**文件名仅用页面功能名**（时间体现在子文件夹），历次互不覆盖。

| 结果 | 输出（均在本次执行子文件夹内） |
|------|------|
| 通过 | 控制台 `【PASSED】` + `<scene>.passed.json`（仅通过项） |
| 失败 | `<scene>.passed.json` + `<scene>.failed.json` + `<scene>.png`；失败项每条带 `id`，截图矩形框标注 `id` |
| 汇总 | `<run>/summary.json`；顶层 `latest-run.json` 指向最近一次执行目录 |

> `passed.json` / `failed.json` 的 `checks[]` 含 `element / check / expected / actual / status`；`failed.json` 额外含 `id`，与截图标注一一对照。
> 开启 `UI_VISION=1` 时，报告会额外写入 `visionChecks[]`，用于 Midscene 截图语义辅助；第一阶段不参与 hard fail。

**占位文案**：`ui-profiles.ts` 中凡校验 placeholder 颜色/字号，必须设 `samplePlaceholderStyle: true`（引擎读 `::placeholder` 伪元素，不读 input 本体 `color`）。

**断言判定**：结合视觉规范 + UI 图，二者冲突以 **UI 图为准**；文案以**实际截图**为准并回写 `specs/verified-page-copy.md`（详见 `.cursor/rules/rm11-ui-design-spec.mdc`）。

**Midscene 辅助**：仅用于 icon-only、svg、截图文案可见性等 DOM 不足场景；不得替代颜色/字号/字重等确定性 Token 断言。

### 6.3 多 scene 同条用例（失败不中断）

同一条 `@visual` 用例覆盖多个页面时，**某个 scene 失败不得阻断后续 scene**：

```ts
import {
  assertVisualInspectionResults,
  inspectPublishFormUi,
  type UiInspectionRunResult,
} from '../../src/helpers/ui-design';

const VISUAL_CONTINUE = { continueOnFail: true } as const;
const visualResults: UiInspectionRunResult[] = [];

await test.step('UI-POST-01', async () => {
  const r = await inspectPublishFormUi(page, testInfo, VISUAL_CONTINUE);
  if (r) visualResults.push(r);
});

// 所有 step 跑完后统一断言
assertVisualInspectionResults(visualResults);
```

- 失败 scene：写入缺陷 JSON/截图，`test.step` 不抛错，继续下一步  
- 整条用例：末尾 `assertVisualInspectionResults` 汇总，有失败则标红

设计 Token 默认值见 `specs/rm11-ui-design-spec.md`；单元素特殊要求在用例或 `ui-profiles.ts` 中覆盖。

---

## 7. 用例「编写合格」检查清单

在**暂不执行自动化**阶段，用例视为合格须满足：

### 7.1 通用

- [ ] 用例 ID、模块、`@flow` / `@visual` 标签正确  
- [ ] 角色与 fixture 匹配（`creatorTest` vs 裸 `test`）  
- [ ] 未重复实现已有 helper 逻辑  
- [ ] 断言可验证、无模糊表述（「正常」「没问题」）  
- [ ] 超时配置合理（上传/登录类已放宽）

### 7.2 @flow

- [ ] 每步有明确断言或合理 `test.step` 边界  
- [ ] 未调用 `inspectUiAndAssert`（全量视觉）  
- [ ] 真实提交类用例已标注是否允许落库

### 7.3 @visual

- [ ] `scene` 名已在 `specs/ui-scenes.md` 登记（新 scene 时）  
- [ ] UI 图已放入 `design-refs/` 并在 scene 表中关联  
- [ ] `ui-profiles.ts` 元素与 UI 图一致  
- [ ] 走查前依赖 loading 等待（默认开启）

---

## 8. 超时与稳定性

| 场景 | 建议 |
|------|------|
| 媒体上传 | `MEDIA_UPLOAD_TIMEOUT_MS`（5min）+ describe 级 timeout |
| Worker 首次登录 | fixture `180s`（`auth-fixture.ts`） |
| 页面 loading | `waitForPageLoadingComplete`（`page-ready.ts`） |
| 验证码冷却 | `auth.ts` 内 `waitForResendCooldown` |

---

## 9. 目录与文档索引

```
specs/
├── case-writing-guide.md      # 本文档
├── ui-scene-workflow.md       # UI 图 → scene 流程
├── ui-scenes.md               # scene 登记册（随功能增补）
├── rm11-ui-design-spec.md     # 设计规范 Token
└── rm11-main-flows.md         # 主流程覆盖矩阵（待维护）

design-refs/                   # UI 设计图存放（按功能分子目录）

tests/
├── post/          @flow
├── auth/          @flow
└── ui/            @visual
```

---

## 10. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-06-07 | 初版：分层、输入模板、登录态、合格清单 |
