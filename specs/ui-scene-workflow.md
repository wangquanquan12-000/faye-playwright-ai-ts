# UI 图 → Scene 配置标准流程

> **目的**：将产品/UI 提供的设计图，稳定转化为可执行的 `@visual` 走查用例与 `ui-profiles` 配置。  
> **前置文档**：`specs/rm11-ui-design-spec.md`（Token 默认值）、`specs/case-writing-guide.md`（用例规范）、`specs/verified-page-copy.md`（已验证文案记忆）  
> **代码落点**：`src/helpers/ui-profiles.ts` → `src/helpers/ui-design.ts` → `tests/ui/*.ui.spec.ts`

> **断言判定铁律**：
> 1. 有 UI 图时，结合「规范 + UI 图」共同判定；理解与 UI 图冲突 **以 UI 图为准**，并回头更新规范 §7 与本流程。
> 2. 无 UI 图时，按规范 + 合理推断断言，并标注假设。
> 3. 文案一律以**实际截图**为准；验证通过即回写 `specs/verified-page-copy.md`。
> 4. `UI_VISION=1` 可开启 Midscene 视觉语义辅助；第一阶段只写 `visionChecks[]`，不作为硬失败依据。

---

## 1. 核心概念

| 术语 | 含义 | 示例 |
|------|------|------|
| **UI 图** | 产品提供的页面/弹窗设计稿（PNG/Figma 导出） | `design-refs/post/step1-form.png` |
| **scene** | 走查场景唯一 ID，对应固定输出文件名 | `publish-form` |
| **profile** | `ui-profiles.ts` 中的 `xxxInspection(page)` 配置 | `publishFormInspection` |
| **inspect 封装** | `ui-design.ts` 中的 `inspectXxxUi` | `inspectPublishFormUi` |
| **视觉用例** | `tests/ui/*.ui.spec.ts` 中带 `@visual` 的 test | `UI-POST-01` |

**关系链**：

```
UI 图 → 视觉事实 → 标注元素 & Token → scene 登记 → ui-profiles → inspect 封装 → tests/ui → reports/ui-defects/{run}/{scene}.*
```

---

## 2. UI 图存放规范

### 2.1 目录结构

```
design-refs/
├── README.md
├── auth/
│   ├── age-gate.png
│   └── landing-auth.png
├── home/
│   └── sidebar.png
└── post/
    ├── step1-form.png
    ├── step2-caption.png
    └── step3-success.png
```

### 2.2 命名建议

- 小写英文 + 连字符：`step1-form.png`  
- 与 `scene` 名语义一致，便于对照  
- 多状态同一页：`publish-form-empty.png` / `publish-form-filled.png`（scene 可共用或拆分为 `-empty` / `-filled`）

### 2.3 提供 UI 图时的最低信息

每张图请附带（可写在 PR、飞书或 `specs/ui-scenes.md`）：

| 字段 | 说明 |
|------|------|
| 功能模块 | 发帖 / 消息 / 订阅 … |
| 页面名称 | 如「发帖 Step1」 |
| 建议 scene 名 | 如 `publish-form`（英文 kebab-case） |
| 需校验元素列表 | 元素中文名 + 图上位置说明 |
| 特殊 Token | 若与 `rm11-ui-design-spec.md` 默认不同，逐项写明 |
| 到达路径简述 | 如何从首页/登录态进入该页 |

---

## 3. 标准流程（六步）

```
┌─────────────┐
│ ① 收 UI 图  │
└──────┬──────┘
       ▼
┌─────────────┐
│ ② 登记 scene│  specs/ui-scenes.md
└──────┬──────┘
       ▼
┌─────────────┐
│ ③ 标元素    │  元素名 / locator 策略 / Token
└──────┬──────┘
       ▼
┌─────────────┐
│ ④ 写 profile│  ui-profiles.ts
└──────┬──────┘
       ▼
┌─────────────┐
│ ⑤ 封装 inspect│ ui-design.ts
└──────┬──────┘
       ▼
┌─────────────┐
│ ⑥ 写视觉用例 │  tests/ui/*.ui.spec.ts（含导航）
└─────────────┘
```

### 步骤 ① 接收 UI 图

- 将文件放入 `design-refs/{模块}/`  
- 确认分辨率/主题（Dark）与测试环境一致

### 步骤 ② 登记 scene

在 `specs/ui-scenes.md` 新增一行（模板见该文件）：

- `scene` 名全局唯一、kebab-case  
- 关联 UI 图路径、视觉用例 ID、导航依赖

### 步骤 ③ 标注校验元素

从 UI 图上圈选 **3～8 个**代表性元素（不宜过多）。

### 步骤 ③½ 同页层级表（**必做，未完成禁止写 profile**）

> **这是杜绝误配的核心步骤。** 禁止从 §7.1 通用表或 Cursor 速记表直接抄 Token。  
> 每张 UI 图在 `specs/ui-scenes.md` 或 PR 里附一张表（可复制下表）：

| 元素（中文名） | UI 图位置 | 与同页谁比更大/更小 | 颜色(01/02/03) | 字号+字重（UI 图） | Type / uiType |
|----------------|-----------|---------------------|----------------|-------------------|---------------|
| 页眉 Promo Link | 顶栏正中 | **全页最大** | 01 | 20px Heavy | Type_01 |
| 卡片 Campaign Name | 卡片顶部 | **小于页眉**，大于副标题与字段名 | 01 | 14px Heavy | `promo-link-active:card-title` |
| Claims 字段名 | 卡片统计区 | 小于数值 | 03 | 12px | Type_08 |
| … | … | … | … | … | … |

**填写规则**：

1. **「与同页谁比」列必填**——不写比较对象 = 不允许定 Token。
2. **Type_01 仅用于页眉级**全页最大标题；卡片内、列表内、弹窗内标题**默认禁止** Type_01，除非层级表证明与页眉同级。
3. 标准 Type_xx 无法表达 UI 图组合 → 先登记 `RM11_UI_SPECIAL_TYPE`（§7.5），再写 `uiType`。
4. 层级表定稿后，同步更新 `specs/rm11-ui-design-spec.md` §7.3 与 `verified-page-copy.md`。

| 元素类型 | 建议校验项 |
|----------|------------|
| **页眉**大标题（全页最大） | `color` + `type` Type_01 |
| 卡片/列表**内**标题 | **先完成层级表**；通常非 Type_01 |
| 主按钮（可点击） | `primaryButton` + `type`（Type_02） |
| 正文/选项 | `color` + `type` + `checkOverflow` |
| 次级/禁用按钮 | `type`，无渐变时可不设 `primaryButton` |
| icon-only 导航 | 入口可见；必要时加 `vision.assertions`，不套文字字号/溢出/左对齐 |

### Midscene 视觉辅助（可选）

对于 DOM 语义不足或容易误判的场景（如 icon-only 导航、svg 图标、截图文案可见性），可在 `ui-profiles.ts` 中增加：

```ts
vision: {
  assertions: [
    {
      assertion: '底部导航包含 Home、Notifications、Post、Message、Profile 五个图标入口',
      expected: 'mobile 底部导航展示 5 个 icon 入口',
    },
  ],
}
```

执行方式：

```bash
UI_VISION=1 npm run test:visual -- tests/ui/post.ui.spec.ts -g "Home 侧栏"
```

输出写入同一个 scene 报告的 `visionChecks[]`。第一阶段 `visionChecks` 不阻断测试，只辅助发现/解释视觉问题。
| 侧栏多项 | `alignmentGroup` 左对齐 |
| 全页 | `checkPageBackground: true`（Grey_01） |

**Token 默认**：未特别说明时，引用 `specs/rm11-ui-design-spec.md`。  
**登录/注册页**：字体体系可能与站内不同，profile 中可只校 `color` + `checkMinFontSize`，不强行套 Type_02。

**Locator 策略**（优先级从高到低）：

1. `getByRole('button', { name: /.../ })`  
2. `getByText('...', { exact: true })`  
3. `locator('nav').getByText(...)` 限定区域  
4. 避免脆弱 CSS class

### 步骤 ④ 编写 profile（`ui-profiles.ts`）

```ts
/** 发帖 Step1 表单走查 — 参考 design-refs/post/step1-form.png */
export function publishFormInspection(page: Page): UiInspectionOptions {
  return {
    scene: 'publish-form',           // 与 ui-scenes.md 一致
    checkPageBackground: true,
    elements: [
      {
        name: 'Image 入口',          // 与 UI 图标注一致，用于缺陷报告
        locator: page.getByText('Image', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      // ...
    ],
  };
}
```

**字段说明**（`UiElementSpec`）：

| 字段 | 用途 |
|------|------|
| `name` | 缺陷报告中的元素名 |
| `locator` | Playwright 定位器 |
| `color` | 期望文字色 Token |
| `type` | 期望 Type_xx 字号字重（与 `uiType` 二选一） |
| `uiType` | UI 图特殊字型键（`RM11_UI_SPECIAL_TYPE` / §7.5）；无标准 Type 时**禁止**改用 `checkMinFontSize` 放宽 |
| `primaryButton` | 是否校验 Button_01 渐变 |
| `checkOverflow` | 文本截断/溢出 |
| `checkMinFontSize` | 不低于 Type_09（10px） |
| `optional` | `true` 时元素不存在不记缺陷 |
| `samplePlaceholderStyle` | **`true` 时从 `::placeholder` 读 color/字号**；凡占位文案必填，禁止误读 input 已输入文字色 |

**占位文案（必守）**：locator 通常用 `getByPlaceholder(...)`，且必须 `samplePlaceholderStyle: true`。  
`getComputedStyle(el).color` 是**已输入内容**的颜色（多为 Light_Yellow_01），不是占位符颜色（Light_Yellow_03）。

**scene 级选项**（`UiInspectionOptions`）：

| 字段 | 默认 | 说明 |
|------|------|------|
| `waitForLoading` | `true` | 走查前等待全屏 loading |
| `readyTimeout` | `30000` | 必选元素可见超时（ms） |
| `alignmentGroup` | — | 侧栏等对齐检查 |

### 步骤 ⑤ 封装 inspect（`ui-design.ts`）

```ts
export async function inspectPublishFormUi(page: Page, testInfo: TestInfo): Promise<void> {
  await inspectUiAndAssert(page, testInfo, publishFormInspection(page));
}
```

命名约定：`inspect` + PascalCase(scene 语义) + `Ui`

### 步骤 ⑥ 编写视觉用例（`tests/ui/`）

```ts
test.describe('@visual Post 页面视觉', () => {
  test('UI-POST 发帖路径各场景走查', async ({ page }, testInfo) => {
    await test.step('UI-POST-01 发帖 Step1 表单', async () => {
      await openNewPostForm(page);                    // 导航：复用 helper
      await expect(page).toHaveURL(/\/publish\?post_id=/);
      await inspectPublishFormUi(page, testInfo);     // 走查
    });
  });
});
```

**导航原则**：

- 视觉用例**不要求**完整业务回归，但必须**稳定到达**目标 scene  
- 优先 `creatorTest` + 已有 helper（`openNewPostForm`、`dismissAgeGate` 等）  
- 新功能尚无 helper 时，可写最小导航步骤，后续抽到 helper

---

## 4. scene 命名规范

| 规则 | 示例 |
|------|------|
| kebab-case | `publish-form`、`age-gate` |
| 语义=页面/弹窗 | `home-sidebar`、`post-success` |
| 以页面标题命名 | `post-details`（页面标题 Post Details） |
| 避免用例标题作 scene 名 | ❌ `访问首页应通过-18-弹窗` |

**输出文件**（固定，勿改 scene 名除非迁移报告）：

```
reports/ui-defects/{run}/{scene}.passed.json、{scene}.failed.json
reports/ui-defects/{scene}.png
reports/ui-defects/{scene}.passed.json
```

---

## 5. 新需求视觉校验 — 最小交付物

每个新页面至少交付：

| # | 交付物 | 路径 |
|---|--------|------|
| 1 | UI 图 | `design-refs/{模块}/` |
| 2 | scene 登记 | `specs/ui-scenes.md` |
| 3 | profile 函数 | `src/helpers/ui-profiles.ts` |
| 4 | inspect 封装 | `src/helpers/ui-design.ts` |
| 5 | 视觉用例 | `tests/ui/{模块}.ui.spec.ts` |
| 6 | （可选）导航 helper | `src/helpers/{模块}.ts` |

---

## 6. 与 @flow 的协作时机

| 场景 | 建议 |
|------|------|
| 新功能刚提测 | **可并行**：visual 用最小导航 + flow 用完整断言 |
| 仅有 UI 图、流程未定 | 先完成步骤 ①～⑥ 的 visual；flow 后补 |
| 已有 flow | visual 直接复用 flow 的 helper，不复制步骤 |

**结论**：视觉校验**不依赖**完整回归用例，但**依赖**可达页面的导航能力。

---

## 7. 走查执行与结果判读

```bash
# 预登录（推荐）
npm run auth:seed

# 跑单个模块视觉
npm run test:visual -- tests/ui/post.ui.spec.ts

# 强制重登
AUTH_REFRESH=1 npm run test:visual -- tests/ui/post.ui.spec.ts
```

| 缺陷类型 | 含义 | 处理 |
|----------|------|------|
| 元素不可见 | 多因 loading 未结束或 locator 错误 | 查导航 / 更新 locator |
| 颜色不符 | 实现与 Token 不一致 | 提 UI bug 或更新规范 |
| 字体大小/字重错误 | 同左 | 确认 UI 图是否例外 |
| 文本截断 | 布局问题 | 提 UI bug |

---

## 8. 已有 scene 速查

完整登记见 **`specs/ui-scenes.md`**。当前已实现：

| scene | UI 图（建议路径） | profile | 视觉用例 |
|-------|-------------------|---------|----------|
| `age-gate` | `design-refs/auth/age-gate.png` | `ageGateInspection` | `auth.ui.spec.ts` |
| `landing-auth` | `design-refs/auth/landing-auth.png` | `landingAuthInspection` | `auth.ui.spec.ts` |
| `home-sidebar` | `design-refs/home/sidebar.png` | `homeSidebarInspection` | `home.ui.spec.ts` |
| `publish-form` | `design-refs/post/step1-form.png` | `publishFormInspection` | `post.ui.spec.ts` |
| `post-details` | `design-refs/post/step2-post-details.png` | `postDetailsInspection` | `post.ui.spec.ts` |
| `post-success` | `design-refs/post/step3-success.png` | `postSuccessInspection` | `post.ui.spec.ts` |

---

## 9. 检查清单（scene 配置完成前）

- [ ] UI 图已入库 `design-refs/`  
- [ ] `specs/ui-scenes.md` 已登记  
- [ ] `scene` 名符合 kebab-case 且全局唯一  
- [ ] 每个必选元素有稳定 locator  
- [ ] Token 与 UI 图一致，例外已注明  
- [ ] `inspectXxxUi` 已导出  
- [ ] 视觉用例含导航 + `creatorTest`（若需登录）  
- [ ] 未在 `@flow` 中混入全量走查  

---

## 10. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-06-07 | 初版：六步流程、命名、交付物、与 @flow 关系 |
