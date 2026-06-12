# Promo Link UI 设计图

> 需求文档：`specs/features/promo-link-requirements.md`  
> Scene 登记：`specs/ui-scenes.md`

| 文件 | Scene | 说明 |
|------|-------|------|
| `monetization-entry.png` | — | Monetization 页 Promo Link 入口 |
| `promo-link-empty.png` | `promo-link-empty` | 空列表 |
| `new-promo-link-default.png` | `promo-link-new-default` | 创建页默认态 |
| `promo-link-created.png` | `promo-link-created` | 创建成功 |
| `promo-link-active.png` | `promo-link-active` | Active 非空列表 |

来源：`v2.15_promo link pic`（v2.15）

## Active 列表同页层级（写断言前必对）

| 元素 | 与谁比 | Token |
|------|--------|-------|
| 页眉 `Promo Link` | 全页最大 | Type_01 20px + 01 |
| 卡片 Campaign Name | **小于页眉**，大于副标题 | `promo-link-active:card-title` 14px Heavy + 01 |
| 卡片副标题 `7 Days Free • …` | 小于主标题，大于 Claims 字段名 | Type_08 12px + 02 |
| Claims/Clicks/Revenue 字段名 | 最小一档 | Type_08 12px + 03 |
| 统计数值 `120`、`$6,720` | 大于字段名，亮金粗体 | `promo-link-active:stat-value` 14px Heavy + 01 |
| 卡片内 Copy Link | 描边按钮文字 | `promo-link-active:card-copy-link` 14px Heavy + 01 |

> **勿将 Type_01 用于卡片 Campaign Name。**
