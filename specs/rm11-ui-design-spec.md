# RM11 UI 设计规范（Design Spec）

> **用途**：UI/UX 视觉比对与自动化 UI 用例的默认参考标准。  
> **优先级**：若某条 UI 用例未特别指定页面、按钮、弹窗的视觉要求，**一律以本文档为准**；若用例中有明确指定，则以用例指定为准。

**平台**：RM11（`https://faye-test.link`）  
**角色定位**：资深 UI/UX 设计师与前端测试专家 — 比对设计稿规范与实际网页截图，找出视觉不一致。

### 视觉走查设备约定

| 类型 | 设备/视口 | 说明 |
|------|-----------|------|
| **`@visual` 视觉走查** | **mobile-chrome（Pixel 7）** | `design-refs/` 下 UI 图均为**移动端**设计稿；PC 页为自适应布局，**不得**用 desktop 视口比对移动 UI 图 |
| **`@flow` 业务回归** | chromium（Desktop 1280×720） | 功能路径与断言，不强制 mobile |

```bash
npm run test:visual    # 已固定 --project=mobile-chrome
npm run test:flow      # desktop chromium
```

Token 映射（§7）来源于移动端 UI 图（Post pic、v2.15 Promo Link 等），走查取样须与之一致。

---

## 1. 页面 / 弹窗 / 线条颜色

| Token | 色值 | 扩展参数 | 适用场景 |
|-------|------|----------|----------|
| **Green** | `#78DFB1` | — | Online 在线状态小绿点 |
| **Red** | `#F2514F` | — | 报错提示文字 |
| **Black_01** | `#222222` | 透明度 80% | 弹窗底部遮罩 |
| **Grey_01** | `#0D0D0D` | — | 所有页面背景、弹窗背景 |
| **Grey_02** | `#221200` | — | 图片加载占位默认色 |
| **Grey_03** | `#858585` | 透明度 40%，模糊 10 | 卡片阴影、按钮阴影 |
| **Grey_04** | `#FE0127` | 透明度 30%，模糊 10 | 登录/注册页按钮阴影 |
| **Line_01** | `#332C1D` | — | 头像描边、分割线 |
| **Line_02** | `#4A412E` | — | 输入框描边 |
| **Line_03** | `#B90332` | — | 登录/注册页按钮描边 |

---

## 2. 文字颜色

| Token | 色值 | 适用场景 |
|-------|------|----------|
| **Light Yellow_01** | `#FFDA91` | 页面/弹窗标题；可点击按钮文字；部分正文；输入框已输入状态文字 |
| **Light Yellow_02** | `#B39966` | 弹窗占位描述文字；部分次级文字 |
| **Light Yellow_03** | `#806D49` | 不可点击按钮文字；输入框未输入占位文字；部分次级文字 |

---

## 3. 按钮颜色

| Token | 色值 | 扩展参数 | 适用场景 |
|-------|------|----------|----------|
| **Button_01** | `#460443` → `#FE0127` | 渐变：左上角 → 右下角 | 按钮可点击状态 |
| **Button_02** | `#230222` → `#7F0114` | 渐变：左上角 → 右下角 | 按钮不可点击（禁用）状态 |
| **Button_03** | `#000000` | — | 登录/注册页可点击按钮 |

---

## 4. 文字字体 & 尺寸 & 字重

**网站统一字体**：`Avenir`

### 字重标签 → 浏览器 `font-weight` 换算

设计稿使用文字标签，自动化比对时按下列映射转换为 CSS 数值：

| 设计标签 | CSS `font-weight` | `font-family` 变体识别 |
|----------|-------------------|------------------------|
| **Heavy** | `800` | 含 `Heavy` / `Black` |
| **Medium** | `500` | 含 `Medium` |
| **Book** | `400` | 含 `Book` / `Roman` / `Regular` |

比对规则（`src/helpers/ui-design.ts`）：
1. `font-family` 命中上表变体名 → 视为字重合格（Avenir 常通过字族名区分字重）
2. 否则比对 `font-weight` 数值，容差 **±100**（相邻档位）
3. 字号容差 **±1px**

| Token | 字号 | 字重（标签） | 适用场景 |
|-------|------|------|----------|
| **Type_01** | 20px | Heavy | 页面 & 弹窗大标题 |
| **Type_02** | 16px | Heavy | 页面 & 弹窗通用大按钮文字（不含小的特殊按钮） |
| **Type_03** | 16px | Medium | 页面 & 弹窗中的内容标题 |
| **Type_04** | 14px | Medium | 正文文字 |
| **Type_05** | 14px | Medium | 输入框内文字（**不含**登录/注册页面） |
| **Type_06** | 12px | Book | 输入框外标注文字 |
| **Type_07** | 14px | Medium | 聊天消息气泡内文字 |
| **Type_08** | 12px | Medium | 部分次级文字 |
| **Type_09** | 10px | — | 最小文字尺寸 |

---

## 5. UI 校验检查清单（默认）

比对实际截图与设计稿时，按以下维度逐项检查：

### 5.1 背景与遮罩
- [ ] 页面/弹窗背景是否为 `Grey_01`（`#0D0D0D`）
- [ ] 弹窗底部遮罩是否为 `Black_01`（`#222222`，80% 透明度）

### 5.2 文字颜色
- [ ] 标题是否为 `Light Yellow_01`（`#FFDA91`）
- [ ] 占位/次级文案是否为 `Light Yellow_02`（`#B39966`）或 `Light Yellow_03`（`#806D49`）
- [ ] 报错文案是否为 `Red`（`#F2514F`）

### 5.3 文字字体 & 尺寸 & 字重
- [ ] 全站字体是否为 `Avenir`（`font-family` 含 Avenir）
- [ ] 页面/弹窗大标题是否为 `Type_01`（20px / Heavy）
- [ ] 通用大按钮文字是否为 `Type_02`（16px / Heavy）
- [ ] 内容标题是否为 `Type_03`（16px / Medium）
- [ ] 正文是否为 `Type_04`（14px / Medium）
- [ ] 输入框内文字（非登录/注册页）是否为 `Type_05`（14px / Medium）
- [ ] 输入框外标注是否为 `Type_06`（12px / Book）
- [ ] 聊天气泡文字是否为 `Type_07`（14px / Medium）
- [ ] 次级文字是否为 `Type_08`（12px / Medium）
- [ ] 最小字号是否不低于 `Type_09`（10px）

### 5.4 按钮
- [ ] 可点击主按钮渐变是否为 `Button_01`（`#460443` → `#FE0127`）
- [ ] 禁用按钮渐变是否为 `Button_02`（`#230222` → `#7F0114`）
- [ ] 登录/注册页可点击按钮是否为 `Button_03`（`#000000`）
- [ ] 登录/注册页按钮描边是否为 `Line_03`（`#B90332`）
- [ ] 登录/注册页按钮阴影是否符合 `Grey_04` 规范

### 5.5 线条与边框
- [ ] 头像描边、分割线是否为 `Line_01`（`#332C1D`）
- [ ] 输入框描边是否为 `Line_02`（`#4A412E`）

### 5.6 状态与装饰
- [ ] 在线绿点是否为 `Green`（`#78DFB1`）
- [ ] 图片占位是否为 `Grey_02`（`#221200`）
- [ ] 卡片/按钮阴影是否符合 `Grey_03` 规范

---

## 6. 走查任务 & 输出格式（Inspection Tasks）

### 6.1 走查任务

每条 UI 视觉校验用例须对照以下三项检查：

1. **核心元素规格**：发帖按钮、输入框、图标栏等的大小、颜色、字号是否与本文档完全一致？
2. **文本布局**：是否存在长文本、多语言或分辨率导致的截断、溢出、折行错误或重叠？
3. **对齐美感**：页面元素左对齐/居中是否凌乱、不符合视觉美感？

### 6.2 严格输出格式

- 页面完全合格：控制台输出 **`【PASSED】`**
- 发现缺陷：输出 **`<scene>.passed.json` + `<scene>.failed.json`**（失败项带 `id`），并保存 **矩形 id 标注截图**

```json
[
  {
    "element": "Share 按钮",
    "issue_type": "颜色不符",
    "description": "按钮背景未呈现 Button_01 渐变（#460443 → #FE0127），实际为纯色",
    "severity": "High"
  }
]
```

`issue_type` 常用值：`颜色不符` / `字体错误` / `字体大小错误` / `字重错误` / `布局错位` / `文本截断`  
`severity`：`High` / `Medium` / `Low`

缺陷截图：`reports/ui-defects/{run}/{scene}.png`（矩形精准框 + `id` 标签）  
通过项：`reports/ui-defects/{run}/{scene}.passed.json`  
失败项：`reports/ui-defects/{run}/{scene}.failed.json`（每条含 `id`）  
最近一次运行汇总：`reports/ui-defects/latest-run.json`

scene 与文件对应：`age-gate`、`landing-auth`、`home-sidebar`、`publish-form`、`post-details`、`post-success`、`promo-link-*`

### 6.3 用例编写约定

1. **默认引用**：UI 用例描述中写「符合 RM11 UI 规范」时，指本文档全部适用项。
2. **覆盖规则**：用例中若写明具体色值或组件样式，以用例为准，未写明部分仍回退到本文档。
3. **比对方式**：`getComputedStyle` 取样，颜色容差 ±3%，字号容差 ±1px。
4. **自动化入口**：
   - `inspectUiAndAssert(page, testInfo, options)` — `src/helpers/ui-inspection.ts`
   - 场景配置 — `src/helpers/ui-profiles.ts`
   - 便捷封装 — `inspectAgeGateUi` / `inspectHomeSidebarUi` 等 — `src/helpers/ui-design.ts`
5. **新用例模板**：

```ts
// 业务/UI 用例 — 复用登录态，禁止每条用例重新登录
import { creatorTest as test, expect } from '../../src/fixtures/auth-fixture';

test('某业务流程', async ({ page }) => { ... });
```

```ts
// 登录/注册专用 @flow 用例 — 显式 reset + login
import { test, expect } from '@playwright/test';
import { loginAsCreator, resetBrowserSession } from '../../src/helpers/auth';

test('AUTH-xx 登录', async ({ page }) => {
  await resetBrowserSession(page);
  await loginAsCreator(page);
});
```

### 登录态默认规则

| 场景 | 做法 |
|------|------|
| Post / UI 走查 / 其他业务 | `creatorTest` → worker 登录一次，`.auth/creator.json` 复用 |
| Token 过期 | `ensureCreatorSession` 自动重登并更新缓存 |
| 登录/注册专用用例 | `resetBrowserSession` + `loginWithEmail` / `registerViewer` |
| 强制全量重登 | `AUTH_REFRESH=1 npm run test ...` |

### 用例分层（@visual / @flow）

| 类型 | 目录/标签 | 职责 |
|------|-----------|------|
| **视觉走查** | `tests/ui/`、`@visual` | 颜色/字号/字重/溢出/对齐；输出 `【PASSED】` 或 JSON + 红圈截图 |
| **业务流程** | `tests/auth/`、`tests/post/` 等、`@flow` | 登录、发帖、Share、Feed 等功能断言；**不含全量 UI 走查** |

```bash
npm run test:visual   # 仅 tests/ui/
npm run test:flow     # 排除视觉专测，跑 @flow 业务用例
```

### 视觉走查用例清单

| 文件 | 场景 |
|------|------|
| `tests/ui/auth.ui.spec.ts` | UI-AGE-01 18+ 弹窗、UI-AGE-02 落地页注册区 |
| `tests/ui/home.ui.spec.ts` | UI-HOME-01 已登录侧栏 |
| `tests/ui/post.ui.spec.ts` | UI-POST-01~04 发帖路径各页 |
| `tests/ui/promo-link.ui.spec.ts` | UI-PROMO-01~04 Promo Link 各页 |

---

## 7. 页面元素 Token 映射（Post / Promo Link）

> 依据 `design-refs/post/`、`design-refs/promo-link/` UI 设计图归纳。  
> 自动化配置见 `src/helpers/ui-profiles.ts`；未列出的元素回退到第 2～4 节通用规则。

### 7.1 通用对照（标题 / 文案 / 按钮）

| 元素角色 | 颜色 Token | 字号 Token | 按钮背景 | 典型示例 |
|----------|------------|------------|----------|----------|
| **页面大标题** | Light_Yellow_01 | Type_01（20px Heavy） | — | Post Details、Promo Link、New Promo Link |
| **内容标题** | Light_Yellow_01 | Type_03（16px Medium） | — | 空态主文案、Promo Link Created! |
| **成功提示/确认文案** | Light_Yellow_02 | Type_08（12px Medium） | — | 发帖/排期成功页提示句（非大标题，勿用 Type_03） |
| **媒体入口 / 选项主标签** | Light_Yellow_01 | Type_03（16px Medium） | 卡片底 + Line_02 描边 | Image、Video、Audio、Vault |
| **正文 / 字段值** | Light_Yellow_01 | Type_04（14px Medium） | — | 卡片内描述、输入框已填内容 |
| **访问权限小标签** | Light_Yellow_01 | Type_08（12px Medium） | — | Everyone、Members、PPV |
| **表单区块标题（Post Details 等）** | Light_Yellow_01 | Type_03（16px Medium） | — | Post Media、Caption、Send On、Who Can Access |
| **输入框外小标注** | Light_Yellow_01 | Type_06（12px Book） | — | Campaign Type 等表单内小标注 |
| **统计字段名（Promo 卡片）** | **Light_Yellow_03** | Type_08（12px Medium） | — | Claims、Clicks、Revenue（暗金棕，非 02） |
| **次级 / 辅助说明** | Light_Yellow_02 | Type_08（12px Medium） | — | Select viewer access…、1 Token Min…、排序说明 |
| **输入框右上角字数统计** | **Light_Yellow_03** | Type_08（12px Medium） | — | 0/200、0/2500 等（与占位符同色，勿与辅助说明混用） |
| **空态副文案** | Light_Yellow_02 | Type_04（14px Medium） | — | You can create a new promo link… |
| **占位符** | Light_Yellow_03 | Type_05（14px Medium） | — | Say Something…、e.g. Spring Sale |
| **主按钮（可点击）** | Light_Yellow_01 | Type_02（16px Heavy） | **Button_01** 渐变 | Post、Generate Campaign、Copy Link、Share |
| **次按钮（描边）** | Light_Yellow_01 | Type_02（16px Heavy） | 透明/黑底 + Line_02 | Done、View Post（部分成功页） |
| **页面背景** | Grey_01 | — | — | 全页 #0D0D0D |
| **输入框描边** | Line_02 | — | — | Caption、PPV Price 等输入区域 |

### 7.2 Post 发帖流程（`design-refs/post/`）

| Scene | UI 图 | 元素 | 颜色 | 字号 | 按钮渐变 |
|-------|-------|------|------|------|----------|
| `publish-form` | `step1-upload-form.png` | Image / Video / Audio / Vault | Light_Yellow_01 | Type_03 | — |
| | | Everyone / Members / PPV | Light_Yellow_01 | **Type_08** | — |
| | | Select viewer access… | Light_Yellow_02 | Type_08 | — |
| | | Upload Guide | Light_Yellow_03 | Type_08 | optional |
| `post-details` | `step2-post-details.png` | Post Details 标题 | Light_Yellow_01 | Type_01 | — |
| | | Post Media / Who Can Access / Caption / Send On 等区块标题 | Light_Yellow_01 | **Type_03** | — |
| | | Everyone / Post Immediately 等选项值 | Light_Yellow_01 | Type_04 | — |
| | | 0/200、0/2500 字数统计 | **Light_Yellow_03** | Type_08 | — |
| | | 1 Token Min… 等辅助说明 | Light_Yellow_02 | Type_08 | — |
| | | Say Something… 占位 | Light_Yellow_03 | Type_05 | — |
| | | Post 按钮 | Light_Yellow_01 | Type_02 | Button_01 |
| `post-success` | `step3-publish-success.png` | 成功提示文案 | **Light_Yellow_02** | **Type_08** | — |
| | | Share / View Scheduel Post / View Post | Light_Yellow_01 | Type_02 | Share、View Scheduel Post=Button_01 |
| | | Done | Light_Yellow_01 | Type_02 | 次按钮 optional |

> **文案**（UI 图 `step3-publish-success.png`）：排期 `Your scheduel post has been set up successfully!`；测试环境即时发布 `Your media has been posted successfully!`。走查用正则兼容两者；**颜色/字号以 UI 图为准**（次级提示 Light_Yellow_02 + Type_08，非 Type_03 大标题）。

### 7.3 Promo Link 流程（`design-refs/promo-link/`）

| Scene | UI 图 | 元素 | 颜色 | 字号 | 按钮渐变 |
|-------|-------|------|------|------|----------|
| `promo-link-empty` | `promo-link-empty.png` | Promo Link 标题 | Light_Yellow_01 | Type_01 | — |
| | | No promo link yet. | Light_Yellow_01 | Type_03 | — |
| | | 空态副文案 | Light_Yellow_02 | Type_04 | — |
| | | Generate Campaign | Light_Yellow_01 | Type_02 | Button_01 |
| `promo-link-new-default` | `new-promo-link-default.png` | New Promo Link 标题 | Light_Yellow_01 | Type_01 | — |
| | | 顶部规则说明 | Light_Yellow_02 | Type_06 | — |
| | | Campaign Name (Optional) 等区块字段名 | Light_Yellow_01 | **Type_03** | 与 Post Details 区块标题同级 |
| | | 占位 e.g. Spring Sale | Light_Yellow_03 | Type_05 | — |
| | | Generate Campaign | Light_Yellow_01 | Type_02 | Button_01 |
| `promo-link-created` | `promo-link-created.png` | Promo Link Created! | Light_Yellow_01 | Type_01 | — |
| | | 链接文本 | Light_Yellow_01 | **特殊 UI 字型** `promo-link-created:url` | UI 图 14px Book |
| | | Copy Link | Light_Yellow_01 | Type_02 | Button_01 |
| `promo-link-active` | `promo-link-active.png` | Active Tab | Light_Yellow_01 | Type_04 | — |
| | | 卡片主标题（Campaign Name） | Light_Yellow_01 | **特殊** `promo-link-active:card-title` | UI 图 **~14px Heavy**；**非**页面大标题 Type_01（20px） |
| | | 卡片副标题 | Light_Yellow_02 | Type_08 | UI 图 ~12px 暗金；如 7 Days Free • 3 Months；**无则跳过** |
| | | Claims / Clicks / Revenue 字段名 | **Light_Yellow_03** | Type_08 | 实测 `rgb(128,109,73)` |
| | | Claims / Clicks / Revenue **数值** | Light_Yellow_01 | **特殊** `promo-link-active:stat-value` | UI 图 ~14px Heavy 亮金数字 |
| | | Claims 带分母时（如 0/100） | Light_Yellow_01 主数字 + **03 分母** | Type_02 / Type_08 | UI 图双色；DOM 合并为单节点时仅校 Claims 数值 |
| | | Copy Link（卡片内） | Light_Yellow_01 | **特殊 UI 字型** `promo-link-active:card-copy-link` | UI 图 14px Heavy |

### 7.4 Token 映射原则（避免误配）

#### 7.4.1 同页层级（写断言前必做）

**禁止**从 §7.1 通用行或速记表直接抄 Token。每张 UI 图必须先完成 **同页层级表**（见 `specs/ui-scene-workflow.md` 步骤 ③½）。

| 层级 | 典型元素 | 字号参考 | 禁止 |
|------|----------|----------|------|
| **L0 页眉** | `Promo Link`、`New Promo Link`、`Post Details` | Type_01 20px | 套用到卡片/列表内文字 |
| **L1 卡片/区块主文案** | Campaign Name、卡片内活动名 | UI 图常 **14px Heavy**（特殊 uiType） | 误用 Type_01 |
| **L2 副文案/统计数值** | 7 Days Free、120、$6,720 | 12～14px | 与 L0 混淆 |
| **L3 字段名/最小标注** | Claims、Clicks、占位旁标注 | Type_08 12px + 03/02 | 与 L2 数值混淆 |

**Promo Link Active 教训（勿再犯）**：页眉 `Promo Link` = Type_01；卡片 `uitest` = **14px Heavy**，不是 20px。

#### 7.4.2 判定顺序

新增走查元素时，**不要仅凭「看起来像辅助文字」就归入 Light_Yellow_02**，按以下顺序判定：

1. **先对 UI 图取色**：在 `design-refs/` 对应截图上确认实际色值（`#806D49` / `#B39966` / `#FFDA91`），再选 Token；三者不可互换。
2. **按元素角色选行**：§7.1 每行对应一种 UI 角色；**同一行不得合并两种角色**（曾将 `0/200` 与 `1 Token Min…` 写在同一格，导致字数统计误用 Light_Yellow_02）。
3. **同色可不同字号**：字数统计与占位符同为 Light_Yellow_03，但字号分别为 Type_08 / Type_05，须分别配置。
4. **规范 §5.2 是粗粒度**：「占位/次级文案」列了 02 或 03，不能代替 §7.1 的元素级映射；自动化以 **§7.1 + 页面 UI 图** 为准。
5. **实测纠偏**：mobile 走查若 `rgb(128,109,73)` = `#806D49` = Light_Yellow_03，应改断言而非强行归到 02。
6. **占位文案取样**：必须 `samplePlaceholderStyle: true`，走查引擎读 `getComputedStyle(el, '::placeholder')`；**禁止**对 placeholder 的 input/textarea 读本体 `color`（那是已输入文字色 `#FFDA91`，会与占位符 `#806D49` 混淆）。
7. **UI 图优先 + 持续纠偏**：理解与 UI 图冲突时以 UI 图为准；纠偏后**当场更新本表**，使同类元素之后自动正确。已知纠偏：Caption 区块标题 → Type_03；输入框字数统计 → Light_Yellow_03；发布成功提示 → Light_Yellow_02 + Type_08；Promo 表单字段名 → Type_03；Promo 统计字段名 → Light_Yellow_03；Promo 占位符 → Type_05。
8. **文案以实测为准**：文案文本一律取自实际截图，记录到 `specs/verified-page-copy.md` 后复用，禁止臆造。
9. **icon-only 导航不套文字规则**：移动端底部 Tab 若只有 icon，不做文字字号、文本溢出、左边缘一致校验；只校验入口存在/可见（必要时再按 UI 图补 icon 色值取样）。
10. **UI 图特殊字型（禁止放宽）**：若 UI 图提取的「字号 + 字重」在标准 Type_xx 中无对应组合，登记为 **特殊 UI 字型**（§7.5 / `RM11_UI_SPECIAL_TYPE`），走查用 `uiType` 严格比对。**禁止**改用 `checkMinFontSize`、省略字重或仅校颜色来绕过。
11. **禁止跨层级套 Token**：见 §7.4.1；未完成层级表不得提交 `ui-profiles.ts` 变更。

### 7.5 UI 图特殊字型登记表

> 代码登记：`src/helpers/ui-design.ts` → `RM11_UI_SPECIAL_TYPE`；profile 引用 `uiType` 键名，**不在 profile 内写死 px/字重**。

| `uiType` 键 | UI 图 | 元素 | 字号 | 字重 | 说明 |
|-------------|-------|------|------|------|------|
| `promo-link-created:url` | `promo-link-created.png` | 金框内链接 URL | 14px | Book | 小于标题、常规字重；非 Type_06（12px）亦非 Type_04/05（Medium） |
| `promo-link-active:card-copy-link` | `promo-link-active.png` | 卡片内 Copy Link 文字 | 14px | Heavy | 描边次按钮；非 Type_02（16px）亦非 Type_04（Medium） |
| `promo-link-active:card-title` | `promo-link-active.png` | 卡片 Campaign Name | 14px | Heavy | 小于页眉 Promo Link（20px）；勿误用 Type_01 |
| `promo-link-active:stat-value` | `promo-link-active.png` | Claims/Clicks/Revenue 数值 | 14px | Heavy | 亮金粗体；大于字段名（12px） |

---

## 8. 快速索引

### 色值

```
Green           #78DFB1
Red             #F2514F
Black_01        #222222 @ 80%
Grey_01         #0D0D0D
Grey_02         #221200
Grey_03         #858585 @ 40% blur 10
Grey_04         #FE0127 @ 30% blur 10
Line_01         #332C1D
Line_02         #4A412E
Line_03         #B90332
Light Yellow_01 #FFDA91
Light Yellow_02 #B39966
Light Yellow_03 #806D49
Button_01       linear #460443 → #FE0127
Button_02       linear #230222 → #7F0114
Button_03       #000000
```

### 字体

```
Font Family     Avenir
Heavy           font-weight 800  (family: Avenir Heavy / Black)
Medium          font-weight 500  (family: Avenir Medium)
Book            font-weight 400  (family: Avenir Book / Roman / Regular)

Type_01         20px  Heavy   页面/弹窗大标题
Type_02         16px  Heavy   通用大按钮文字
Type_03         16px  Medium  内容标题
Type_04         14px  Medium  正文
Type_05         14px  Medium  输入框内文字（非登录/注册）
Type_06         12px  Book    输入框外标注
Type_07         14px  Medium  聊天气泡
Type_08         12px  Medium  次级文字
Type_09         10px  —       最小字号
```
