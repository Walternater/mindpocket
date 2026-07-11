# AGENT

这是一个基于 Turborepo 的 monorepo 项目

## Architecture

### Tech Stack

**Web 前端 (apps/web):**
- **框架**: Next.js 16 (App Router)，`output: "export"` 纯静态导出（无服务端运行时）
- **UI**: Radix UI + Tailwind CSS 4
- **状态管理**: Zustand
- **动画**: Motion (Framer Motion)
- **其他**: React Native Web (跨平台组件共享)

**API 后端 (apps/api，Cloudflare Workers):**
- **框架**: Hono
- **认证**: Better Auth (email/password + 2FA + device authorization)
- **数据库**: Cloudflare D1 (SQLite) + Drizzle ORM
- **向量检索**: Cloudflare Vectorize（1024 维 cosine）
- **文件存储**: Cloudflare R2
- **AI**: Vercel AI SDK（openai-compatible，用户在设置里自配 provider）
- **部署**: 单个 Worker 同时服务静态资产（apps/web/out）与 /api/*，见 `docs/CLOUDFLARE.md`

**Native 应用:**
- **框架**: Expo + React Native
- **路由**: Expo Router
- **UI**: HeroUI Native + Tailwind (uniwind)
- **导航**: React Navigation

### 认证架构

使用 Better Auth 实现认证系统：
- **服务端**: `apps/api/src/lib/auth.ts` - 每请求工厂 `createAuth(env, db)`（Workers 下 D1 binding 只在请求上下文可用）
- **客户端**: `apps/web/lib/auth-client.ts` - 客户端 SDK
- **API 挂载**: `apps/api/src/index.ts` - `/api/auth/*`
- **数据库 Schema**: `apps/api/db/schema/auth.ts`

### 数据库架构

- **ORM**: Drizzle ORM（sqlite 方言）
- **数据库**: Cloudflare D1
- **配置文件**: `apps/api/drizzle.config.ts`
- **Schema 位置**: `apps/api/db/schema/`
- **迁移文件**: `apps/api/db/migrations/`
- **客户端**: `apps/api/db/client.ts`（`createDb(env.DB)`）；业务代码通过 `apps/api/src/context.ts` 的 AsyncLocalStorage 代理使用模块级 `db`

本地密钥放 `apps/api/.dev.vars`（`BETTER_AUTH_SECRET`）。

### UI 组件

- **组件库**: 使用 shadcn/ui 风格的组件系统
- **配置文件**: `apps/web/components.json`
- **组件位置**: `apps/web/components/ui/`
- **自定义组件**: `apps/web/components/` (如 login-form, sidebar-left 等)

## Important Notes

### 包管理器

- 必须使用 **pnpm** (版本 10.9.0)
- 这是一个 workspace monorepo，使用 `workspace:*` 协议引用内部包

### 代码风格

- 使用 **Biome** 进行 lint 和格式化（不是 ESLint/Prettier）
- 使用 **Ultracite** 进行额外的代码检查

### 数据库工作流

1. 修改 schema 文件 (`apps/api/db/schema/`)
2. 在 `apps/api` 运行 `pnpm db:generate` 生成迁移
3. 运行 `pnpm db:migrate:local` 应用到本地 D1（开发）
4. 运行 `pnpm db:migrate:remote` 应用到远程 D1（生产）

### 创建新用户

注册在首个用户创建后自动关闭。新环境直接通过 `/signup` 页面或
`POST /api/auth/sign-up/email` 注册第一个用户即可。

### 部署

`pnpm deploy:cf` 一键构建并部署到 Cloudflare Workers，完整流程见 `docs/CLOUDFLARE.md`。
前端是纯静态导出（无 middleware/proxy），登录保护由客户端守卫 + API 层鉴权（`apps/api/src/middleware.ts`）完成。


### Turbo 缓存

Turborepo 会缓存构建结果以加速后续构建。如果遇到缓存问题，可以：
- 删除 `.turbo` 目录
- 运行 `pnpm clean` 清理所有缓存

完成任务后，需要检查代码和格式化


# 注意

写代码要求有简单注释


完成一个任务后需要进行，代码检查和格式化
pnpm lint          # 使用 Biome 进行 lint
pnpm format        # 使用 Biome 格式化代码
pnpm check         # 使用 Ultracite 检查
pnpm fix           # 使用 Ultracite 修复

以确保代码质量。

做完后使用 chrome dev tool mcp 测试界面是否符合预期

## 参考
./docs/PROJECT.md