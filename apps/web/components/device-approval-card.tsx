"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type VerifyStatus = "idle" | "loading" | "pending" | "approved" | "denied" | "error"

interface DeviceApprovalCardProps {
  initialUserCode: string
  userName: string
}

interface ApiErrorShape {
  error?: string
  error_description?: string
  message?: string
}

function normalizeUserCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

function formatUserCode(value: string) {
  const clean = normalizeUserCode(value)
  if (clean.length <= 4) {
    return clean
  }
  return `${clean.slice(0, 4)}-${clean.slice(4)}`
}

async function parseError(response: Response) {
  const text = await response.text()
  if (!text) {
    return `请求失败（${response.status}）`
  }

  try {
    const data = JSON.parse(text) as ApiErrorShape
    return data.error_description || data.message || data.error || `请求失败（${response.status}）`
  } catch {
    return text
  }
}

async function fetchVerificationStatus(value: string) {
  const formatted = formatUserCode(value)
  if (!normalizeUserCode(formatted)) {
    return {
      status: "error" as const,
      message: "请输入应用显示的用户验证码。",
    }
  }

  const response = await fetch(`/api/auth/device?user_code=${encodeURIComponent(formatted)}`, {
    credentials: "include",
  })

  if (!response.ok) {
    return {
      status: "error" as const,
      message: await parseError(response),
    }
  }

  const data = (await response.json()) as { status?: "pending" | "approved" | "denied" }
  const nextStatus = data.status ?? "error"

  if (nextStatus === "pending") {
    return {
      status: nextStatus,
      message: "验证码有效。确认后，该设备将以你的账户身份访问 MindPocket。",
    }
  }

  if (nextStatus === "approved") {
    return {
      status: nextStatus,
      message: "这个设备授权已经完成，无需重复操作。",
    }
  }

  if (nextStatus === "denied") {
    return {
      status: nextStatus,
      message: "这个设备授权已被拒绝。",
    }
  }

  return {
    status: "error" as const,
    message: "无法识别当前授权状态。",
  }
}

function getDecisionMessage(decision: "approve" | "deny") {
  if (decision === "approve") {
    return "授权成功。你可以回到应用，它会继续完成登录。"
  }

  return "你已拒绝这次设备授权。应用会收到拒绝结果。"
}

export function DeviceApprovalCard({ initialUserCode, userName }: DeviceApprovalCardProps) {
  const [userCodeInput, setUserCodeInput] = useState(formatUserCode(initialUserCode))
  const [status, setStatus] = useState<VerifyStatus>(initialUserCode ? "loading" : "idle")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(null)

  const cleanUserCode = useMemo(() => normalizeUserCode(userCodeInput), [userCodeInput])

  useEffect(() => {
    if (!initialUserCode) {
      return
    }

    const runVerification = async () => {
      setStatus("loading")
      setMessage("")

      const result = await fetchVerificationStatus(initialUserCode)
      setStatus(result.status)
      setMessage(result.message)
    }

    runVerification()
  }, [initialUserCode])

  const verifyCode = async (value: string) => {
    setStatus("loading")
    setMessage("")

    const result = await fetchVerificationStatus(value)
    setStatus(result.status)
    setMessage(result.message)
  }

  const handleDecision = async (decision: "approve" | "deny") => {
    const formatted = formatUserCode(cleanUserCode)
    setSubmitting(decision)
    setMessage("")

    const response = await fetch(`/api/auth/device/${decision}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ userCode: formatted }),
    })

    setSubmitting(null)

    if (!response.ok) {
      setStatus("error")
      setMessage(await parseError(response))
      return
    }

    setStatus(decision === "approve" ? "approved" : "denied")
    setMessage(getDecisionMessage(decision))
  }

  const statusContent =
    status === "loading" ? (
      <span className="inline-flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在校验设备授权状态...
      </span>
    ) : (
      <span>{message || "打开应用提供的链接后，这里会显示授权状态。"}</span>
    )

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>授权 MindPocket 设备访问</CardTitle>
        <CardDescription>
          当前登录账户：{userName}。输入或确认应用展示的用户验证码，然后决定是否授权。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="font-medium text-sm" htmlFor="user-code">
            用户验证码
          </label>
          <div className="flex gap-2">
            <Input
              autoCapitalize="characters"
              autoCorrect="off"
              id="user-code"
              onChange={(event) => setUserCodeInput(formatUserCode(event.target.value))}
              placeholder="例如 ABCD-EFGH"
              value={userCodeInput}
            />
            <Button onClick={() => verifyCode(userCodeInput)} type="button" variant="outline">
              校验
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm">{statusContent}</div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row">
        <Button
          className="flex-1"
          disabled={status !== "pending" || submitting !== null}
          onClick={() => handleDecision("approve")}
          type="button"
        >
          {submitting === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : "允许访问"}
        </Button>
        <Button
          className="flex-1"
          disabled={status !== "pending" || submitting !== null}
          onClick={() => handleDecision("deny")}
          type="button"
          variant="outline"
        >
          {submitting === "deny" ? <Loader2 className="h-4 w-4 animate-spin" /> : "拒绝授权"}
        </Button>
      </CardFooter>
    </Card>
  )
}
