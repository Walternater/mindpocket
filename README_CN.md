<p align="center">
  <img src="./docs/icon.svg" width="80" height="80" alt="MindPocket Logo" />
</p>

<h1 align="center">MindPocket</h1>

<p align="center">
  完全开源、免费、多端、一键部署、AI Agent 集成的个人收藏夹系统
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

<p align="center">
  <img src="./docs/all.png" alt="MindPocket Preview" />
</p>

<details>
<summary>📸 更多截图</summary>

| Web 界面 | AI 对话 | 移动端 |
|:---:|:---:|:---:|
| ![Web](./docs/pic/web1.png) | ![AI Chat](./docs/pic/web2.png) | ![Mobile](./docs/pic/phone.png) |
| ![Web Detail](./docs/pic/web3.png) | ![Extension](./docs/pic/extension.png) | |

</details>

MindPocket 将你的收藏内容进行分类存储，并通过 AI Agent 进行 RAG 内容总结和标签生成，方便你快速找到和管理收藏内容。

## ✨ 特性

1. **Serverless**: 一条命令部署到 Cloudflare Workers，无需维护服务器
2. **零成本**: 完全跑在 Cloudflare 免费层（Workers + D1 + Vectorize + R2）
3. **多端支持**: Web + Mobile + Browser Extension 三端覆盖
4. **AI 增强**: RAG 和 AI Agent 集成，智能标签和内容总结
5. **CLI 友好**: 官方 CLI 方便与 OpenClaw 等外部 Agent 集成
6. **开源免费**: 完全开源，数据完全属于你自己

## 🎨 VIBE CODING

这是一个纯 **VIBE CODING** 的项目：

- 我只实现了一个核心功能，其余功能基本全部由 Claude Code 实现
- 纯代码 **26,256 行**，详细见 [代码洞察](./docs/codeinsight.md)
- VIBE Coding 经验总结见 [开发经验](./docs/experience.md)
- VIBE Coding 实战复盘见 [我如何用 AI 把项目从 0 做到可用](./docs/vibe-coding.md)
- 欢迎 VIBE Coding PR！！！

欢迎交流 VIBE Coding 经验！

## 🚀 部署

MindPocket 完全运行在 **Cloudflare 免费层** 上——单个 Worker 同时服务静态前端和 API：

| 资源 | 用途 | 免费额度 |
|------|------|---------|
| Workers + 静态资产 | Hono API + Next.js 静态导出 | 10 万请求/天 |
| D1 | 关系数据（SQLite） | 5 GB |
| Vectorize | 向量检索（替代 pgvector） | 3000 万查询维度/月 |
| R2 | 文件存储（替代 MinIO） | 10 GB |

### 快速开始

```bash
# 1. 一次性创建云资源（D1 / Vectorize / R2），详见 docs/CLOUDFLARE.md
cd apps/api
pnpm exec wrangler d1 create mindpocket
pnpm exec wrangler vectorize create mindpocket-embeddings --dimensions=1024 --metric=cosine
pnpm exec wrangler vectorize create-metadata-index mindpocket-embeddings --property-name=userId --type=string
pnpm exec wrangler r2 bucket create mindpocket
pnpm exec wrangler secret put BETTER_AUTH_SECRET

# 2. 回填 apps/api/wrangler.jsonc 里的 database_id / R2_PUBLIC_URL / NEXT_PUBLIC_APP_URL

# 3. 应用迁移并部署（仓库根目录）
pnpm --filter api db:migrate:remote
pnpm deploy:cf
```

完整指南（含从旧版自托管 Postgres/MinIO 迁移数据）：[docs/CLOUDFLARE.md](./docs/CLOUDFLARE.md)

## 💻 本地开发

### 环境要求

- Node.js 18+
- pnpm 10.9.0

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/jihe520/mindpocket
cd mindpocket

# 安装依赖
pnpm install

# 本地密钥
echo "BETTER_AUTH_SECRET=dev-secret" > apps/api/.dev.vars

# 初始化本地 D1 数据库
pnpm --filter api db:migrate:local

# 启动 API worker（同时服务静态资产 + /api/*）
pnpm --filter api dev
```

访问 http://127.0.0.1:8787 开始使用。需要前端热更新时，另开 `pnpm --filter web dev`（http://127.0.0.1:3000）。

### 开发命令

```bash
# 根目录
pnpm dev          # 启动所有应用
pnpm build        # 构建所有应用
pnpm deploy:cf    # 构建并部署到 Cloudflare Workers
pnpm cli:build    # 构建 CLI 包
pnpm format       # 格式化代码
pnpm check        # 代码检查

# API (apps/api)
pnpm dev                 # wrangler dev（本地模拟 D1/R2）
pnpm db:generate         # 生成迁移
pnpm db:migrate:local    # 应用迁移到本地 D1
pnpm db:migrate:remote   # 应用迁移到远程 D1
pnpm deploy              # wrangler deploy

# Web (apps/web)
pnpm dev          # 启动 Next.js（纯前端）
pnpm build        # 静态导出到 apps/web/out

# Native (apps/native)
pnpm dev          # 启动 Expo
pnpm android      # 运行 Android
pnpm ios          # 运行 iOS
```

## CLI

MindPocket CLI 是官方命令行客户端，适合 Agent、脚本和开发者在终端中与 MindPocket 服务交互。

### 安装

```bash
npm install -g mindpocket
```

或者使用 pnpm：

```bash
pnpm add -g mindpocket
```

### 快速开始

```bash
mindpocket --help
mindpocket config set server https://your-domain.com
mindpocket auth login
mindpocket user me
mindpocket bookmarks list
```

## 🛠 技术栈

### Web 前端
- **框架**: Next.js 16 (App Router，静态导出)
- **UI**: Radix UI + Tailwind CSS 4
- **状态管理**: Zustand
- **动画**: Motion (Framer Motion)

### API 后端（Cloudflare Workers）
- **框架**: Hono
- **认证**: Better Auth
- **数据库**: Cloudflare D1 + Drizzle ORM
- **向量检索**: Cloudflare Vectorize
- **文件存储**: Cloudflare R2
- **AI**: Vercel AI SDK（openai-compatible）

### Mobile 应用
- **框架**: Expo + React Native
- **路由**: Expo Router

### Browser Extension
- **框架**: WXT
- **构建**: Vite

### 工程化
- **Monorepo**: Turborepo
- **包管理**: pnpm
- **代码质量**: Biome + Ultracite

## 📱 支持平台

- ✅ Web 应用
- ✅ iOS / Android 移动应用
- ✅ 浏览器插件（Chrome / Firefox / Edge）

## 🚧 项目状态 & ROADMAP

- [ ] 添加更多设置配置选项在 UI 界面，更加友好用户体验
- [ ] 支持更多收藏解析平台
- [ ] 优化 AI Agent 交互体验
- [ ] 优化 RAG
- ...

[todolist](./docs/todo.md) 查看详细 ROADMAP

为了方便部署和保持免费，尽量减少外部服务依赖
欢迎提 Issue 讨论功能建议和实现方案

## 🤝 贡献

欢迎各种形式的贡献：

1. 🐛 提交 Bug 报告和功能建议
2. 💡 分享 VIBE Coding 经验
3. 🔧 提交 Pull Request（欢迎 VIBE Coding PR）
4. 📖 完善文档

### 加入社区

**QQ 群**: 682827415

[点击加入群聊【MindPocket】](https://qm.qq.com/q/EOwlK8AiJM)

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE)

## 🙏 致谢

感谢 Claude Code 在本项目开发中的巨大贡献！
