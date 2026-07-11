/**
 * API 基础地址工具
 * 生产环境前端与 API 同域，NEXT_PUBLIC_API_BASE 为空即可（同域相对路径）。
 * 本地开发时 next dev 在 :3000、API 在 :8787，可设置
 * NEXT_PUBLIC_API_BASE=http://localhost:8787 实现跨域访问。
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""

/** 拼接 API 路径，如 apiUrl("/api/user") */
export function apiUrl(path: string) {
  return `${API_BASE}${path}`
}
