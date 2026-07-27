import { createAuthClient } from "better-auth/react"
import { API_BASE } from "@/lib/api-base"

export const authClient = createAuthClient({
  // 生产环境同域（留空即当前 origin），本地跨域开发时用 NEXT_PUBLIC_API_BASE 指向 :8787
  baseURL: API_BASE || undefined,
})

export const { signIn, signOut, signUp, useSession } = authClient
