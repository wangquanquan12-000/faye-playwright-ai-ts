# Specs

测试计划、用例规范与设计规范目录。

## 核心文档

| 文件 | 说明 |
|------|------|
| **`case-writing-guide.md`** | **用例编写规范**（@flow / @visual、登录态、合格清单） |
| **`ui-scene-workflow.md`** | **UI 图 → scene 配置标准流程**（六步落地） |
| `ui-scenes.md` | Scene 登记册（scene 与 UI 图、用例映射） |
| `rm11-ui-design-spec.md` | RM11 UI 设计 Token（颜色/字体/按钮）+ §7.4 断言纠偏原则 |
| **`verified-page-copy.md`** | **已验证页面文案记忆**（实际截图确认的文本/字号/颜色，断言前必查、验证后必写） |
| `rm11-main-flows.md` | 主流程覆盖矩阵（P0/P1 跟踪） |
| `features/promo-link-requirements.md` | **Promo Link 需求文档**（v2.15） |
| `homepage-plan.md` | 首页测试计划（Planner 参考） |

## 关联目录

| 目录 | 说明 |
|------|------|
| `../design-refs/` | UI 设计图存放（按功能分子目录） |
| `../tests/ui/` | `@visual` 视觉走查用例 |
| `../tests/post/`、`../tests/auth/` | `@flow` 业务流程用例 |

## 用例分层

`tests/ui/` = `@visual`；`tests/auth/`、`tests/post/` = `@flow`

```bash
npm run test:flow      # 业务回归
npm run test:visual    # 视觉走查
```
