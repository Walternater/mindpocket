import type { DeepTranslationRecord, Locale } from "./shared"

const zh = {
  nav: {
    features: "功能",
    solutions: "价格",
    platform: "多端",
    roadmap: "路线图",
    changelog: "更新日志",
    login: "登录",
    signup: "注册",
    getStarted: "立即开始",
    mobile: "手机端",
    web: "网页端",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    languageZh: "中文",
    languageEn: "EN",
  },
  hero: {
    badge: "开源 · 免费 · 一键部署",
    title: "你的个人 AI 收藏系统",
    subtitle:
      "MindPocket 帮你统一管理网页、移动端和浏览器插件收藏内容，自动生成摘要与标签，检索和回顾都更高效。",
    primaryCta: "立即部署",
    secondaryCta: "查看文档",
    savedLinks: "收藏趋势",
    savingTrend: "今年你每周新增收藏，明显高于去年。",
    savesPerWeek: "条/周",
    all: "全部",
    links: "链接",
    articles: "文章",
    item1Title: "React RSC 缓存模式",
    item1Meta: "react.dev · 2小时前",
    item2Title: "AI SDK 工具调用指南",
    item2Meta: "vercel.com · 1天前",
  },
  features: {
    title: "为个人收藏管理而生",
    subtitle: "从采集、归档到 AI 检索，一套系统覆盖你的收藏工作流。",
    items: [
      {
        title: "零成本部署",
        description: "Vercel + Neon 免费额度即可满足个人使用，无需自建服务器。",
      },
      {
        title: "多端同步",
        description: "支持 Web、移动端、浏览器插件，随时随地保存与查看收藏。",
      },
      {
        title: "AI 增强",
        description: "基于 RAG 自动总结内容并生成标签，快速定位你需要的信息。",
      },
    ],
  },
  integrations: {
    title: "连接你常用的知识来源",
    subtitle: "围绕内容输入、组织和检索建立统一入口，减少切换成本。",
    cta: "开始使用",
  },
  content: {
    title: "不仅是收藏夹，更是你的个人知识库",
    paragraph1: "MindPocket 会对收藏内容做结构化整理，按文件夹和标签自动归类，降低信息堆积。",
    paragraph2: "结合 AI Agent 与向量检索，你可以直接提问历史收藏内容，快速得到可执行答案。",
    quote: "以前收藏越多越难找，现在是越用越顺手。尤其是自动摘要和标签，真的省下很多整理时间。",
    author: "早期用户反馈",
    authorRole: "独立开发者",
  },
  stats: {
    title: "MindPocket 关键能力",
    subtitle: "围绕个人长期使用场景设计：免费、可控、可持续扩展。",
    items: [
      { value: "100%", label: "开源可自托管" },
      { value: "3 端", label: "Web / Mobile / Extension" },
      { value: "1 分钟", label: "完成一键部署" },
    ],
  },
  testimonials: {
    title: "面向真实收藏场景，而不是演示项目",
    subtitle: "从个人开发者到重度信息用户，都能快速建立自己的收藏工作台。",
    items: [
      {
        text: "我把技术文章、产品灵感和待办资料都放在 MindPocket。AI 总结后，复盘效率高很多。",
        name: "Kai",
        role: "独立开发者",
      },
      {
        text: "浏览器插件一键收藏非常顺手，回到 Web 端可以直接按标签检索，不再重复收藏。",
        name: "Lena",
        role: "产品经理",
      },
      {
        text: "移动端查看体验很好，通勤路上就能快速浏览和整理前一天收藏。",
        name: "Ming",
        role: "内容创作者",
      },
      {
        text: "最喜欢的是数据可控和开源，后续接自己的模型和服务也方便。",
        name: "Rui",
        role: "全栈工程师",
      },
    ],
  },
  cta: {
    title: "现在就搭建你的 AI 收藏系统",
    subtitle: "Fork 仓库并部署到 Vercel，几分钟即可开始使用。",
    primary: "立即开始",
    secondary: "查看部署文档",
  },
  changelog: {
    title: "更新日志",
    subtitle: "查看 MindPocket 最近的产品更新与体验优化。",
  },
  footer: {
    links: ["功能", "方案", "用户", "定价", "帮助", "关于"],
    copyright: "MindPocket. All rights reserved.",
  },
  pricing: {
    title: "100% 免费开源",
    subtitle: "MindPocket 是完全开源的项目，你可以免费使用、修改和部署。",
    planTitle: "开源版本",
    price: "$0 / 永久免费",
    description: "完整功能，无限制使用",
    features: [
      "完整的 Web、Mobile、Extension 三端支持",
      "AI 智能摘要与标签生成",
      "多端数据同步",
      "自托管部署，数据完全可控",
      "Vercel + Neon 免费额度部署",
      "开源代码，可自由修改",
      "社区支持",
      "持续更新维护",
    ],
    github: "查看 GitHub 项目",
    deploy: "一键部署",
  },
} as const

export type SiteTranslationDict = DeepTranslationRecord<typeof zh>

const en: SiteTranslationDict = {
  nav: {
    features: "Features",
    solutions: "Pricing",
    platform: "Platform",
    roadmap: "Roadmap",
    changelog: "Changelog",
    login: "Login",
    signup: "Sign Up",
    getStarted: "Get Started",
    mobile: "Mobile",
    web: "Web",
    openMenu: "Open Menu",
    closeMenu: "Close Menu",
    languageZh: "中文",
    languageEn: "EN",
  },
  hero: {
    badge: "Open Source · Free · One-Click Deploy",
    title: "Your Personal AI Bookmark System",
    subtitle:
      "MindPocket unifies bookmarks across web, mobile, and browser extension, then auto-generates summaries and tags for faster retrieval.",
    primaryCta: "Deploy Now",
    secondaryCta: "Read Docs",
    savedLinks: "Saved Links",
    savingTrend: "You are saving more bookmarks per week this year than in 2025.",
    savesPerWeek: "Saves/week",
    all: "All",
    links: "Links",
    articles: "Articles",
    item1Title: "React RSC Caching Patterns",
    item1Meta: "react.dev · 2h ago",
    item2Title: "AI SDK Tool Calling Guide",
    item2Meta: "vercel.com · 1 day ago",
  },
  features: {
    title: "Built for Personal Knowledge Capture",
    subtitle: "From collection and organization to AI retrieval, one workflow for your bookmarks.",
    items: [
      {
        title: "Zero-Cost Deploy",
        description: "Vercel + Neon free tiers are enough for personal usage.",
      },
      {
        title: "Multi-Platform",
        description: "Use Web, Mobile, and Browser Extension to save and access anywhere.",
      },
      {
        title: "AI Powered",
        description: "RAG-based summaries and auto tags help you find information instantly.",
      },
    ],
  },
  integrations: {
    title: "Connect Your Favorite Knowledge Sources",
    subtitle: "Create one unified entry for capture, organization, and retrieval.",
    cta: "Get Started",
  },
  content: {
    title: "More Than Bookmarks, It Is Your Personal Knowledge Base",
    paragraph1:
      "MindPocket structures your saved content with folders and tags, so your archive stays searchable over time.",
    paragraph2:
      "With AI Agent and vector search, you can ask questions over your saved history and get actionable answers.",
    quote:
      "The more I save, the easier it gets to find things. Auto summaries and tags save me a lot of cleanup time.",
    author: "Early User Feedback",
    authorRole: "Indie Developer",
  },
  stats: {
    title: "Core Product Signals",
    subtitle: "Designed for long-term personal usage: free, controllable, and extensible.",
    items: [
      { value: "100%", label: "Open Source" },
      { value: "3 Apps", label: "Web / Mobile / Extension" },
      { value: "1 Min", label: "One-Click Deploy" },
    ],
  },
  testimonials: {
    title: "Built for Real Bookmark Workflows",
    subtitle: "From indie makers to heavy information consumers, setup is quick and practical.",
    items: [
      {
        text: "I keep technical articles, product ideas, and references in one place. AI summaries make review much faster.",
        name: "Kai",
        role: "Indie Developer",
      },
      {
        text: "One-click save from the extension is smooth. Later I search by tags on web without duplicate saves.",
        name: "Lena",
        role: "Product Manager",
      },
      {
        text: "Mobile reading and quick cleanup during commute became part of my daily routine.",
        name: "Ming",
        role: "Content Creator",
      },
      {
        text: "Open source and data ownership matter most to me. Integrating my own models is straightforward.",
        name: "Rui",
        role: "Full-stack Engineer",
      },
    ],
  },
  cta: {
    title: "Build Your AI Bookmark System Today",
    subtitle: "Fork the repo and deploy on Vercel in minutes.",
    primary: "Get Started",
    secondary: "Deploy Guide",
  },
  changelog: {
    title: "Changelog",
    subtitle: "Track the latest product updates and improvements in MindPocket.",
  },
  footer: {
    links: ["Features", "Solutions", "Customers", "Pricing", "Help", "About"],
    copyright: "MindPocket. All rights reserved.",
  },
  pricing: {
    title: "100% Free and Open Source",
    subtitle: "MindPocket is fully open source. You can use, modify, and deploy it for free.",
    planTitle: "Open Source Edition",
    price: "$0 / Forever free",
    description: "Full functionality with no usage limits",
    features: [
      "Full support across Web, Mobile, and Extension",
      "AI-powered summaries and tag generation",
      "Cross-platform sync",
      "Self-hosted deployment with full data control",
      "Deploy on free tiers from Vercel + Neon",
      "Open source code you can freely modify",
      "Community support",
      "Continuous updates and maintenance",
    ],
    github: "View GitHub project",
    deploy: "One-click deploy",
  },
}

export const siteDictionaries: Record<Locale, SiteTranslationDict> = { zh, en }

export function getSiteDictionary(locale: Locale): SiteTranslationDict {
  return siteDictionaries[locale]
}
