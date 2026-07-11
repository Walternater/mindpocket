# Cloudflare 部署指南

整个应用跑在一个 Cloudflare Worker 上（免费计划即可）：

- **Workers 静态资产**：Next.js 静态导出产物（`apps/web/out`）
- **Hono API**（`apps/api`）：全部 `/api/*` 路由
- **D1**：关系数据（SQLite）
- **Vectorize**：向量检索（1024 维 cosine，替代 pgvector）
- **R2**：文件存储（替代 MinIO）

## 一、首次部署

### 1. 创建云资源（一次性）

```bash
cd apps/api

# D1 数据库（把输出的 database_id 回填到 wrangler.jsonc）
pnpm exec wrangler d1 create mindpocket

# Vectorize 索引（1024 维，cosine）+ userId 元数据索引（查询过滤必需）
pnpm exec wrangler vectorize create mindpocket-embeddings --dimensions=1024 --metric=cosine
pnpm exec wrangler vectorize create-metadata-index mindpocket-embeddings --property-name=userId --type=string

# R2 存储桶（然后在控制台开启 Public Access，把公开域名填到 wrangler.jsonc 的 R2_PUBLIC_URL）
pnpm exec wrangler r2 bucket create mindpocket
```

### 2. 配置

- `apps/api/wrangler.jsonc`：回填 `database_id`；`R2_PUBLIC_URL` 填 R2 公开域名（如 `https://pub-xxx.r2.dev`）；`NEXT_PUBLIC_APP_URL` 填 Worker 域名（如 `https://mindpocket.<你的子域>.workers.dev`）。
- Secrets：

```bash
pnpm exec wrangler secret put BETTER_AUTH_SECRET
```

### 3. 应用数据库迁移

```bash
pnpm --filter api db:migrate:remote
```

### 4. 构建并部署

```bash
# 仓库根目录
pnpm deploy:cf
```

（等价于：构建 `@repo/types` → 静态导出 web → `wrangler deploy`）

## 二、从自托管（Docker Postgres + MinIO）迁移数据

```bash
cd apps/api

# 1. 从旧 Postgres 导出（生成 migration-output/）
DATABASE_URL=postgres://user:pass@host:5432/db pnpm tsx scripts/migrate-to-d1.ts

# 2. 导入 D1（远程）
pnpm exec wrangler d1 execute mindpocket --remote --file=migration-output/d1-import.sql

# 3. 向量导入 Vectorize（复用原有 1024 维向量，无需重新 embedding）
pnpm exec wrangler vectorize insert mindpocket-embeddings --file=migration-output/vectorize.ndjson
```

MinIO 里的文件（图片/上传的原始文件）用 `rclone` 或 `mc mirror` 同步到 R2（S3 兼容 API），路径保持一致即可。书签里存的旧 URL 指向旧 MinIO 域名，若要彻底下线 MinIO，可在 D1 里批量替换 URL 前缀：

```sql
UPDATE bookmark SET url = replace(url, '旧MinIO公开地址', '新R2公开地址'), file_url = replace(file_url, '旧MinIO公开地址', '新R2公开地址') WHERE file_url IS NOT NULL;
UPDATE bookmark SET cover_image = replace(cover_image, '旧MinIO公开地址', '新R2公开地址') WHERE cover_image IS NOT NULL;
```

## 三、本地开发

```bash
# API + 静态资产（本地模拟 D1/R2；Vectorize 本地模拟不可用时语义搜索自动降级为关键词搜索）
pnpm --filter api dev          # http://127.0.0.1:8787

# 前端热更新开发（可选，直接开发 UI 时用）
pnpm --filter web dev          # http://127.0.0.1:3000，API 请求需指向 8787
```

本地密钥放 `apps/api/.dev.vars`（已 gitignore）：

```
BETTER_AUTH_SECRET=<随机字符串>
```

本地建表：`pnpm --filter api db:migrate:local`

## 四、免费额度对照

| 资源 | 免费额度 | 说明 |
|---|---|---|
| Workers | 100k 请求/天 | 静态资产请求免费不计数 |
| D1 | 5GB / 500 万行读/天 | |
| Vectorize | 3000 万查询维度/月 | 1024 维 ≈ 3 万次搜索/月 |
| R2 | 10GB 存储 | 出口流量免费 |

## 五、与旧架构的行为差异

- **微信公众号等强 JS 站点**：服务端不再跑无头浏览器。链接照常秒存，服务端轻量抓取失败的会进入**浏览器抓取队列**（状态"等待浏览器抓取"）——扩展每 10 分钟在后台认领任务，用后台标签页打开页面（带你的登录态）、Readability 解析后回传，质量优于任何服务端方案。前提是电脑浏览器装了扩展并登录。
- **PDF/Word 文件**：Web 端上传时在浏览器内解析（pdfjs），服务端只解析纯文本类文件。
- **AI 对话断线续传**（resumable-stream + Redis）：已停用，对话流式输出不受影响。
- **B 站视频**：服务端直接调 B 站 API，行为不变。
