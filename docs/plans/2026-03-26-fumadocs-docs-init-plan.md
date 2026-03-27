# Fumadocs `/docs` 初始化实施记录

## 目标

- 在 `apps/site` 接入公开文档路由 `/docs`
- 使用 Fumadocs 提供布局、页面树和搜索
- 保持现有 `/changelog` 独立
- 避免与现有营销站资源路径冲突

## 实施范围

- 新增 Fumadocs 配置、内容源和动态路由
- 新增最小文档内容与页面树元数据
- 在官网导航增加 `Docs`
- 将原本占用 `/docs/pic/*` 的营销图片迁移到独立静态路径

## 验证

- `pnpm lint`
- `pnpm format`
- `pnpm check`
- `pnpm fix`
- `pnpm --filter site build`
