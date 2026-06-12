# 已验证页面文案记忆

> **用途**：记录通过**项目实际截图**确认过的页面文案（文本内容、字号、颜色 Token）。  
> **铁律**：所有文案一律以**项目实际截图**为准，不得凭记忆臆造。生成/修改视觉用例前先查本表；  
> 页面验证通过后，**必须**把该页确认的文案回写到此表。  
> **设备**：截图均来自 `mobile-chrome`（Pixel 7），对齐 `design-refs/` 移动端 UI 图。

---

## 维护规则

1. 每验证完一个页面（实际截图 / `error-context.md` 快照确认），在下方登记或更新该页一节。
2. 文案需逐字记录（含拼写错误，如 `scheduel`），便于走查正则与断言精确匹配。
3. 字号/颜色若与「视觉规范默认」不同，在「Token 例外」列注明，并同步 `rm11-ui-design-spec.md` §7。
4. 测试环境与设计稿文案不一致时，两者都记，并标注来源（实测 / UI 图）。

---

## Post 发帖流程

### `publish-form`（Step1 媒体上传 + 访问权限）
来源：`design-refs/post/step1-upload-form.png` + 实测截图

| 文案 | 颜色 | 字号 | 备注 |
|------|------|------|------|
| `Image` / `Video` / `Vault` | Light_Yellow_01 | Type_03 | 媒体入口 |
| `Everyone` / `Members` / `PPV` | Light_Yellow_01 | Type_08（12px） | 访问权限小标签 |
| `Select viewers access (multiple options allowed)` | Light_Yellow_02 | Type_08 | 说明文案（注意 `viewers`，无撇号） |
| `Upload Guide` | Light_Yellow_03 | Type_08 | 可选 |
| `(2/10)` 计数 | — | — | 媒体上传计数格式 `(n/10)` |

### `post-details`（Post Details 页）
来源：`design-refs/post/step2-post-details.png` + 实测截图

| 文案 | 颜色 | 字号 | 备注 |
|------|------|------|------|
| `Post Details`（页面标题） | Light_Yellow_01 | Type_01（20px） | 页面大标题 |
| `Post Media` | Light_Yellow_01 | Type_03（16px） | 区块标题 |
| `Who Can Access` | Light_Yellow_01 | Type_03 | 区块标题 |
| `Caption` | Light_Yellow_01 | Type_03 | 区块标题（**非** Type_06） |
| `Send On` | Light_Yellow_01 | Type_03 | 区块标题 |
| `PPV Price` | Light_Yellow_01 | Type_03 | 仅选 PPV 时出现 |
| `Everyone`（访问值） | Light_Yellow_01 | Type_04（14px） | 选项值 |
| `Post Immediately`（Send On 值） | Light_Yellow_01 | Type_04 | 默认排期值 |
| `Cover` | Light_Yellow_01 | Type_08 | 封面角标 |
| `0/2500`（即时） / `0/200` | **Light_Yellow_03** | Type_08 | **字数统计=占位符同色** |
| `1 Token Min. 10K Tokens Max.` | Light_Yellow_02 | Type_08 | PPV 辅助说明 |
| `Say Something…`（占位） | Light_Yellow_03 | Type_05 | **须 `samplePlaceholderStyle`** |
| `Post`（按钮） | Light_Yellow_01 | Type_02 + Button_01 | 主按钮 |

> 字数统计上限随权限变化：Everyone 实测为 `0/2500`，设计稿 PPV 流程标注 `0/200`，走查正则兼容 `\d+/(200|2500)`。

### `post-success`（发布/排期成功页）
来源：`design-refs/post/step3-publish-success.png`（排期） + 实测截图（即时发布）

| 文案 | 颜色 | 字号 | 来源 | 备注 |
|------|------|------|------|------|
| `Your media has been posted successfully!` | **Light_Yellow_02** | **Type_08（12px）** | 实测（即时发布） | 次级提示文案，**非** Type_03 大标题 |
| `Your scheduel post has been set up successfully!` | Light_Yellow_02 | Type_08 | UI 图（排期） | 注意拼写 `scheduel` |
| `Share`（按钮） | Light_Yellow_01 | Type_02 + Button_01 | 实测 | 主按钮 |
| `View Post`（按钮） | Light_Yellow_01 | Type_02 | 实测（即时） | — |
| `View Scheduel Post`（按钮） | Light_Yellow_01 | Type_02 + Button_01 | UI 图（排期） | 拼写 `Scheduel` |
| `Done`（次按钮） | Light_Yellow_01 | Type_02 | UI 图 | 可选 |

> 走查正则兼容即时/排期两套文案：`/your (media|scheduel?).*(posted|set up) successfully/i`。

---

## Promo Link（`tests/ui/promo-link.ui.spec.ts`）

> 字体/颜色 Token 以 `design-refs/promo-link/` UI 图 + mobile 实测为准（2026-06-12 纠偏）。

| 文案 / 元素 | 颜色 Token | 字号 Token | 来源 |
|-------------|------------|------------|------|
| `Promo Link`（列表标题） | Light_Yellow_01 | Type_01 | UI 图 |
| `No promo link yet.` | Light_Yellow_01 | Type_03 | UI 图 |
| 空态副文案 | Light_Yellow_02 | Type_04 | UI 图 |
| `New Promo Link` | Light_Yellow_01 | Type_01 | UI 图 |
| 顶部折扣规则说明 | Light_Yellow_02 | Type_06 | 实测 |
| `Campaign Name (Optional)` / `Campaign Type` | Light_Yellow_01 | **Type_03** | 实测 ~16px |
| 占位 `e.g. Spring Sale` | Light_Yellow_03 | **Type_05** | 实测 ~14px |
| `Promo Link Created!` | Light_Yellow_01 | Type_01 | UI 图 |
| 生成的 promolink URL | Light_Yellow_01 | **特殊** `promo-link-created:url`（14px Book） | UI 图 |
| `Copy Link`（成功页主按钮） | Light_Yellow_01 | Type_02 | UI 图 + Button_01 |
| `Claims` / `Clicks` / `Revenue` 字段名 | **Light_Yellow_03** | Type_08 | 实测 `rgb(128,109,73)` |
| Claims / Clicks / Revenue **数值** | Light_Yellow_01 | **特殊** `promo-link-active:stat-value`（14px Heavy） | UI 图 |
| 卡片主标题（`uitest`） | Light_Yellow_01 | **特殊** `promo-link-active:card-title`（14px Heavy） | UI 图；非 Type_01 |
| 卡片副标题（如 Days Free） | Light_Yellow_02 | Type_08 | UI 图 ~12px；无则跳过 |
| `Copy Link`（卡片描边按钮） | Light_Yellow_01 | **特殊** `promo-link-active:card-copy-link`（14px Heavy） | UI 图 |

---

## 待补充

以下页面验证后请补全文案：`age-gate`、`landing-auth`、`home-sidebar`。
