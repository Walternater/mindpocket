module.exports = {
  reactStrictMode: true,
  // 纯前端静态导出，部署时由 Cloudflare Worker 同域服务静态资产和 /api/*
  output: "export",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // 静态导出不支持图片优化服务
  images: { unoptimized: true },
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
    },
    resolveExtensions: [".web.js", ".web.jsx", ".web.ts", ".web.tsx", ".js", ".jsx", ".ts", ".tsx"],
  },
}
