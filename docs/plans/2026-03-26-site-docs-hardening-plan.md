# Site Docs Hardening

## Goal

- 移除 `apps/site` 对 Google Fonts 的构建期依赖
- 关闭不需要的主题注入，消除 hydration mismatch 根因
- 为公开 docs 输出绝对 canonical URL

## Changes

- 更新 `apps/site/app/layout.tsx`
- 更新 `apps/site/app/globals.css`
- 复用现有 docs metadata 逻辑

## Validation

- `pnpm format`
- `pnpm lint`
- `pnpm check`
- `pnpm fix`
- `pnpm --filter site build`
