# Extension 平台按钮开关设计

## 背景

当前 `apps/extension` 会在已支持的平台页面自动注入 MindPocket 按钮，注入范围写死在 content script 中。用户希望在 extension 设置页里增加平台级开关，用来控制哪些平台显示该按钮。

本次设计目标：

- 仅控制页面内的自动注入按钮
- 不影响 popup 中手动“收藏此页面”能力
- 默认行为保持不变
- 设置切换后刷新页面生效
- 设置页使用简洁的 switch 交互

## 范围

本次仅覆盖当前已支持自动注入的平台：

- `twitter`
- `zhihu`
- `xiaohongshu`

不扩展到全部平台元信息，不引入“方案预设”或“方案收藏”。

## 推荐方案

采用本地配置 + content 调度层统一判断的方案。

### 1. 本地设置存储

在 `apps/extension/lib/auth-client.ts` 增加平台开关设置封装，复用现有 `chrome.storage.local` 模式。

建议新增：

- storage key：`mindpocket_injection_platforms`
- 类型：
  - `SupportedInjectionPlatform = "twitter" | "zhihu" | "xiaohongshu"`
  - `InjectionPlatformSettings = Record<SupportedInjectionPlatform, boolean>`
- 默认值：
  - `twitter: true`
  - `zhihu: true`
  - `xiaohongshu: true`

读取时合并默认值，保证老用户未配置时仍维持当前行为。

### 2. content script 调度

在 `apps/extension/entrypoints/content.ts` 中，把当前直接调用：

- `injectButtonsIntoTweets()`
- `injectButtonsIntoZhihuAnswers()`
- `injectButtonsIntoXiaohongshuNotes()`

改为：

- 先读取平台开关设置
- 再按开启状态决定是否执行对应注入函数

平台判断只放在调度层。各平台注入文件继续只负责 DOM 注入实现，不承担设置读取逻辑。

这样可以避免：

- 高频 `MutationObserver` 下重复读取 storage
- 设置逻辑分散到多个平台文件
- 后续新增平台时遗漏某一侧改动

### 3. popup 设置页

在 `apps/extension/entrypoints/popup/App.tsx` 的 `SettingsPage` 中：

- 保留现有“服务器地址”设置
- 新增“平台按钮开关”分组
- 每个平台一行
- 左侧平台名称，右侧使用 switch
- 默认全部开启
- 用户修改后通过现有“保存”按钮统一保存

平台仅展示当前支持自动注入的 3 个，不展示全部平台元信息，避免误导用户。

平台名称可复用共享平台元信息中的 label，避免重复维护。

### 4. 生效方式

设置保存后采用“刷新页面后生效”。

这意味着：

- 新打开或刷新后的页面按最新配置注入
- 当前已打开页面不做立即清理或即时恢复

这样可以保持实现简单，避免额外的 DOM 清理逻辑。

## 数据流

### 设置页读取

打开 `SettingsPage` 时：

1. 读取 `serverUrl`
2. 读取平台开关设置
3. 若无历史配置，则回退到默认值（全部开启）

### 设置页编辑

用户切换 switch 时：

- 仅更新组件本地 state
- 不立即写入 storage

### 设置页保存

点击“保存”时：

- 一次性保存 `serverUrl`
- 一次性保存平台开关对象

### 页面注入

content script 运行时：

1. 读取平台开关配置
2. 仅执行开启的平台注入函数
3. 关闭的平台直接跳过

### 手动收藏

popup 中“收藏此页面”继续走现有逻辑，不受平台开关影响。

## 关键文件

- `apps/extension/lib/auth-client.ts`
- `apps/extension/entrypoints/content.ts`
- `apps/extension/entrypoints/popup/App.tsx`
- `apps/extension/entrypoints/popup/App.css`

## 验证

### 功能验证

1. 无历史配置时，3 个平台默认都继续注入按钮
2. 关闭单个平台后，刷新该平台页面，不再显示按钮
3. 其他未关闭平台仍正常注入
4. popup 中“收藏此页面”仍正常可用
5. 重开扩展或浏览器后，平台开关状态保持不变

### 非目标

本次不包含：

- 立即生效的页面内清理
- 全平台设置面板
- 方案预设
- 方案收藏
- 平台注入逻辑重构

## 后续实现建议

按以下顺序落地：

1. 补 storage key、默认值与 helper
2. 改 content 调度层
3. 改 popup 设置页 switch UI
4. 补最小样式
5. 运行 `pnpm format` 和 `pnpm check`
