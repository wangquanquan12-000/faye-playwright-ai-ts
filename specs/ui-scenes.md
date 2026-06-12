# UI Scene 登记册

> **维护说明**：每新增一个视觉走查场景，在本表登记一行。  
> **流程**：见 `specs/ui-scene-workflow.md`  
> **设计 Token 默认**：`specs/rm11-ui-design-spec.md`

---

## 登记模板（复制使用）

```markdown
### `{scene}`

| 字段 | 值 |
|------|-----|
| 模块 | |
| 视觉用例 ID | UI-XXX-NN |
| UI 图 | `design-refs/...` |
| profile | `xxxInspection` in `ui-profiles.ts` |
| inspect | `inspectXxxUi` in `ui-design.ts` |
| 用例文件 | `tests/ui/....ui.spec.ts` |
| 角色/前置 | Creator 已登录 / 未登录 … |
| 导航方式 | `openNewPostForm` / `page.goto('/')` … |
| 校验元素 | 元素 A、元素 B … |
| Token 例外 | 无 / 列出与规范不同的项 |
| 状态 | 已实现 / 待实现 / 已废弃 |
```

---

## 已登记 Scene

### `age-gate`

| 字段 | 值 |
|------|-----|
| 模块 | 认证 |
| 视觉用例 ID | UI-AGE-01 |
| UI 图 | `design-refs/auth/age-gate.png`（待入库） |
| profile | `ageGateInspection` |
| inspect | `inspectAgeGateUi` |
| 用例文件 | `tests/ui/auth.ui.spec.ts` |
| 角色/前置 | 未登录，访问 `/` |
| 导航方式 | `page.goto('/')` |
| 校验元素 | Adults only 标题、I'm over 18 按钮、Leave 按钮（可选） |
| Token 例外 | 无 |
| 状态 | 已实现 |

### `landing-auth`

| 字段 | 值 |
|------|-----|
| 模块 | 认证 |
| 视觉用例 ID | UI-AGE-02 |
| UI 图 | `design-refs/auth/landing-auth.png`（待入库） |
| profile | `landingAuthInspection` |
| inspect | `inspectLandingAuthUi` |
| 用例文件 | `tests/ui/auth.ui.spec.ts` |
| 角色/前置 | 已过 18+，落地页 |
| 导航方式 | `goto('/')` + `dismissAgeGate` |
| 校验元素 | Sign up with Email、Log in 按钮 |
| Token 例外 | 登录/注册页字体可不套站内 Type_02 |
| 状态 | 已实现 |

### `home-sidebar`

| 字段 | 值 |
|------|-----|
| 模块 | Home |
| 视觉用例 ID | UI-HOME-01 |
| UI 图 | `design-refs/home/sidebar.png`（待入库） |
| profile | `homeSidebarInspection` |
| inspect | `inspectHomeSidebarUi` |
| 用例文件 | `tests/ui/home.ui.spec.ts` |
| 角色/前置 | Creator 已登录 |
| 导航方式 | `creatorTest` → `/home` |
| 校验元素 | mobile 底部 Home / Notifications / Post / Message / Profile 入口可见 |
| Token 例外 | mobile 底部 Tab 为 icon-only，不校验文字字号/文本溢出/左边缘一致 |
| 状态 | 已实现 |

### `publish-form`

| 字段 | 值 |
|------|-----|
| 模块 | 发帖 |
| 视觉用例 ID | UI-POST-01 |
| UI 图 | `design-refs/post/step1-upload-form.png` |
| profile | `publishFormInspection` |
| inspect | `inspectPublishFormUi` |
| 用例文件 | `tests/ui/post.ui.spec.ts` |
| 角色/前置 | Creator 已登录 |
| 导航方式 | `openNewPostForm` |
| 校验元素 | Image/Video、Everyone/Members/PPV、访问说明 |
| Token 例外 | Everyone 等为 Type_08（12px）；见 `rm11-ui-design-spec.md` §7.2 |
| 状态 | 已实现 |

### `post-details`

| 字段 | 值 |
|------|-----|
| 模块 | 发帖 |
| 视觉用例 ID | UI-POST-02 |
| UI 图 | `design-refs/post/step2-post-details.png` |
| profile | `postDetailsInspection` |
| inspect | `inspectPostDetailsUi` |
| 用例文件 | `tests/ui/post.ui.spec.ts` |
| 角色/前置 | Creator 已登录，Step1 已上传并 Next |
| 导航方式 | `openNewPostForm` → `uploadPostMedia` → `selectEveryoneAccess` → `clickPostNext` |
| 校验元素 | Post Details 标题、返回、Post Media、缩略图/Cover、Who Can Access、访问权限值、PPV（可选）、Caption/Send On 区块与占位、Post 按钮 |
| Token 例外 | 区块标题 Type_03；字数统计 Light_Yellow_03 + Type_08；占位 Light_Yellow_03 + Type_05 |
| 状态 | 已实现 |

### `post-success`

| 字段 | 值 |
|------|-----|
| 模块 | 发帖 |
| 视觉用例 ID | UI-POST-03 |
| UI 图 | `design-refs/post/step3-publish-success.png` |
| profile | `postSuccessInspection` |
| inspect | `inspectPostSuccessUi` |
| 用例文件 | `tests/ui/post.ui.spec.ts` |
| 角色/前置 | Creator 已登录，已发布成功 |
| 导航方式 | 完整发帖至 `/publish/success` |
| 校验元素 | 成功提示文案 Light_Yellow_02 + Type_08；Share / View Post / Done 按钮 |
| Token 例外 | 成功文案为次级提示（非 Type_03）；兼容即时/排期两种 copy |
| 状态 | 已实现 |

### `promo-link-empty`

| 字段 | 值 |
|------|-----|
| 模块 | Promo Link |
| 视觉用例 ID | UI-PROMO-01 |
| UI 图 | `design-refs/promo-link/promo-link-empty.png` |
| profile | `promoLinkEmptyInspection` |
| inspect | `inspectPromoLinkEmptyUi` |
| 用例文件 | `tests/ui/promo-link.ui.spec.ts` |
| 角色/前置 | Creator 已登录；账号无 Promo Link |
| 导航方式 | `openPromoLinkList` |
| 校验元素 | 标题、空态文案、Generate Campaign 按钮 |
| Token 例外 | 中间 icon 为 optional |
| 状态 | 已实现 |

### `promo-link-new-default`

| 字段 | 值 |
|------|-----|
| 模块 | Promo Link |
| 视觉用例 ID | UI-PROMO-02 |
| UI 图 | `design-refs/promo-link/new-promo-link-default.png` |
| profile | `promoLinkNewDefaultInspection` |
| inspect | `inspectPromoLinkNewDefaultUi` |
| 用例文件 | `tests/ui/promo-link.ui.spec.ts` |
| 角色/前置 | Creator 已登录 |
| 导航方式 | `openPromoLinkList` → `openNewPromoLinkForm` |
| 校验元素 | 标题、顶部提示、字段名、占位文案、Generate Campaign |
| Token 例外 | 区块字段名 Type_03（16px），非通用表 Type_04 |
| 状态 | 已实现 |

### `promo-link-created`

| 字段 | 值 |
|------|-----|
| 模块 | Promo Link |
| 视觉用例 ID | UI-PROMO-03 |
| UI 图 | `design-refs/promo-link/promo-link-created.png` |
| profile | `promoLinkCreatedInspection` |
| inspect | `inspectPromoLinkCreatedUi` |
| 用例文件 | `tests/ui/promo-link.ui.spec.ts` |
| 角色/前置 | 刚创建成功 |
| 导航方式 | 填写默认表单 → `submitPromoLinkGenerateCampaign` |
| 校验元素 | 成功 icon（optional）、标题、链接、Copy Link |
| Token 例外 | 链接文本为特殊 UI 字型 `promo-link-created:url`（14px Book，见 §7.5） |
| 状态 | 已实现 |

### `promo-link-active`

| 字段 | 值 |
|------|-----|
| 模块 | Promo Link |
| 视觉用例 ID | UI-PROMO-04 |
| UI 图 | `design-refs/promo-link/promo-link-active.png` |
| profile | `promoLinkActiveInspection` |
| inspect | `inspectPromoLinkActiveUi` |
| 用例文件 | `tests/ui/promo-link.ui.spec.ts` |
| 角色/前置 | 至少一条 Active link |
| 导航方式 | 创建成功后关闭成功页 |
| 校验元素 | uitest 卡片主/副标题、Claims/Clicks/Revenue 字段名与数值、Copy Link |
| Token 例外 | 层级表见 `design-refs/promo-link/README.md`；卡片主标题/数值/Copy Link 用 §7.5 uiType |
| 前置 | 创建时 Campaign Name 固定 `uitest`（`PROMO_LINK_TEST_CAMPAIGN_NAME`） |
| 状态 | 已实现 |

---

## 待登记（全量 UI 图到位后补充）

| 模块 | 建议 scene 前缀 | 状态 |
|------|-----------------|------|
| 消息 Messages | `messages-` | 待规划 |
| 通知 Notifications | `notifications-` | 待规划 |
| Profile | `profile-` | 待规划 |
| 订阅/支付 | `subscription-` | 待规划 |
| Concierge | `concierge-` | 待规划 |
