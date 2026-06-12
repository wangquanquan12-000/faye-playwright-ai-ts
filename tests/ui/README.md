# UI 视觉走查（@visual）

与业务流程用例（`@flow`）分离，仅校验 RM11 设计规范。

| 文件 | 场景 | scene 输出名 |
|------|------|--------------|
| `auth.ui.spec.ts` | 18+ 弹窗、落地页注册区 | `age-gate`、`landing-auth` |
| `home.ui.spec.ts` | 已登录 Home 侧栏 | `home-sidebar` |
| `post.ui.spec.ts` | 发帖路径各页面 | `publish-form`、`post-details`、`post-success` |
| `promo-link.ui.spec.ts` | Promo Link 各页面 | `promo-link-empty`、`promo-link-new-default`、`promo-link-created`、`promo-link-active` |

```bash
npm run test:visual              # mobile-chrome（Pixel 7），对齐 design-refs 移动端 UI 图
npm run test:visual -- --headed
npm run test:visual -- tests/ui/post.ui.spec.ts
UI_VISION=1 npm run test:visual -- tests/ui/post.ui.spec.ts -g "Home 侧栏" # 开启 Midscene 视觉辅助
```

> 勿用 `--project=chromium` 跑视觉走查：PC 自适应布局与移动端 UI 图字号/颜色不一致，会产生误报。

**登录态**：本目录用例使用 `creatorTest`，worker 内登录一次并缓存到 `.auth/creator.json`；勿在 UI 用例里手写 `loginAsCreator`。

跑视觉走查前建议（mobile 视口登录缓存）：

```bash
AUTH_REFRESH=1 npm run auth:seed:mobile
```

**多 scene 连续走查**：同一条用例内各 `test.step` 使用 `inspectXxxUi(page, testInfo, { continueOnFail: true })`，末尾 `assertVisualInspectionResults(results)`。某 scene 失败会写入 `ui-defects` 并继续后续 scene，整条用例最后统一标失败。

## reports/ui-defects/ 说明（按执行隔离）

**每次执行**生成一个独立子文件夹 `reports/ui-defects/<时间戳>/`，本次所有产物只落在该文件夹内，历次互不覆盖、不再混到一起。

```
reports/ui-defects/
├── 2026-06-11_16-41-05/              # 一次执行（子文件夹 = 执行时间戳）
│   ├── post-details.passed.json    # 通过项检查清单
│   ├── post-details.failed.json      # 失败项检查清单（每条带 id）
│   ├── post-details.png              # 精准矩形标注 + id 标签
│   ├── post-success.passed.json      # 全通过 scene 仅写 passed
│   └── summary.json                  # 本次各 scene 结果汇总
└── latest-run.json                   # 顶层指针：最近一次执行的目录
```

| 产物 | 含义 |
|------|------|
| `<scene>.passed.json` | 通过项检查清单 |
| `<scene>.failed.json` + `.png` | 失败项（每条带 `id`）+ 精准矩形标注截图 |
| `<run>/summary.json` | 本次执行各 scene 结果汇总 |
| `latest-run.json` | 顶层指针，指向最近一次执行的子文件夹 |

- **子文件夹** = 执行时间戳；**文件名** = 页面功能名（scene），不再带时间。
- 同一次 `playwright test` 内多个 scene 共用一个子文件夹。
- 清理历史：直接删除旧的时间戳子文件夹即可。

### 报告内容（无论通过/失败都列出全部检查）

每个 scene 报告含 `summary`（total/passed/failed）与 `checks[]`，每条检查记录：

| 字段 | 说明 |
|------|------|
| `element` | 验证元素名 |
| `check` | 检查项（颜色/字号/字重/字体/主按钮渐变/最小字号/文本溢出/对齐/页面背景/可见性/占位取样） |
| `expected` | 预期值（Token + 实际色值/字号等） |
| `actual` | 实际值 |
| `status` | `passed` / `failed` |
| `mark` | 失败项为 `🔴 FAILED`，通过项为空 |
| `issue_type` / `severity` | 仅失败项 |
| `visionChecks` | `UI_VISION=1` 时生成的 Midscene 视觉语义辅助结果 |

- **全通过**：仅生成 `<scene>.passed.json`。
- **有失败**：同时生成 `<scene>.passed.json`（通过项）与 `<scene>.failed.json`（失败项，每条带 `id`）；截图矩形框上标注对应 `id`。
- **Midscene**：`visionChecks[]` 只做辅助说明，第一阶段不影响测试最终 pass/fail。

规范：`specs/rm11-ui-design-spec.md`
