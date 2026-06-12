# UI 设计图存放目录

本目录存放 RM11 功能 UI 设计稿，供 `@visual` 视觉走查对照使用。

## 目录约定

```
design-refs/
├── auth/          # 认证、18+、落地页
├── home/          # 首页、侧栏、Feed
├── post/          # 发帖各步骤
├── promo-link/    # Promo Link v2.15
└── {新模块}/      # 按功能扩展
```

## 文件要求

- 格式：PNG（推荐）或 WebP  
- 命名：小写英文 + 连字符，如 `step1-form.png`  
- 主题：与测试环境一致（RM11 默认 Dark）  
- **设备**：均为 **移动端** 设计稿（iPhone / 移动 Web）  
- 每张图请在 `specs/ui-scenes.md` 登记对应 `scene`

视觉走查命令使用 `mobile-chrome`（Pixel 7），见 `npm run test:visual`。

## 关联流程

1. UI 图放入本目录  
2. 按 `specs/ui-scene-workflow.md` 配置 scene  
3. 运行 `npm run test:visual` 生成 `reports/ui-defects/`

> 设计 Token 默认值见 `specs/rm11-ui-design-spec.md`
