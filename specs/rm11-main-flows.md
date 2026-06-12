# RM11 主流程覆盖矩阵

> **用途**：跟踪主流程回归（`@flow`）与视觉（`@visual`）覆盖状态。  
> **用例规范**：`specs/case-writing-guide.md`  
> **更新方式**：每新增/完成用例后更新本表「覆盖状态」列

---

## 图例

| 状态 | 含义 |
|------|------|
| ✅ | 已实现 |
| 🚧 | 编写中 |
| ⬜ | 未覆盖 |
| — | 不适用 |

---

## P0 主流程

| 模块 | 流程简述 | @flow 用例 | @visual scene | 覆盖状态 | 备注 |
|------|----------|------------|---------------|----------|------|
| 认证 | 18+ 年龄确认 | `tests/auth/age-gate.spec.ts` | `age-gate` | ✅ / ✅ | |
| 认证 | 落地页注册区展示 | — | `landing-auth` | — / ✅ | 无独立 flow |
| 认证 | Creator 邮箱登录 | `tests/auth/creator-login.spec.ts` | — | ✅ / — | 登录专测 |
| 认证 | Viewer 注册 | `tests/auth/viewer-auth.spec.ts` | — | ✅ / — | |
| Home | 已登录侧栏 | — | `home-sidebar` | — / ✅ | |
| 发帖 | Creator 发帖完整流程 | `tests/post/post.spec.ts` | `publish-form` 等 | ✅ / 🚧 | visual 部分 scene 待 UI 图入库 |
| Monetization | Promo Link 创建主流程 | `tests/promo-link/promo-link.spec.ts` | `promo-link-*` | 🚧 / 🚧 | 用例已编写，待执行验证 |

---

## P1 主流程（待扩展）

| 模块 | 流程简述 | @flow | @visual | 覆盖状态 |
|------|----------|-------|---------|----------|
| 消息 | 收发消息 | ⬜ | ⬜ | |
| 通知 | 通知列表 | ⬜ | ⬜ | |
| Profile | 个人资料编辑 | ⬜ | ⬜ | |
| 订阅 | 订阅/解锁内容 | ⬜ | ⬜ | |
| 支付 | Tokens / 支付 | ⬜ | ⬜ | |

---

## 需求输入 → 用例跟踪

新增主流程时，在下方记录业务方输入摘要，便于追溯：

| 日期 | 用例 ID | 需求摘要 | 负责人 | 状态 |
|------|---------|----------|--------|------|
| — | POST-01~05 | Creator 发帖主流程 | — | ✅ |
| 2026-06-10 | PROMO-01~04 | Promo Link 空页/创建/成功/Active | — | 🚧 |
