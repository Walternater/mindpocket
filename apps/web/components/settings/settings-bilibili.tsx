"use client"

import { Check, Loader2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/lib/i18n"

export function SettingsBilibili() {
  const t = useT()
  const [hasCredentials, setHasCredentials] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sessdata, setSessdata] = useState("")
  const [biliJct, setBiliJct] = useState("")
  const [buvid3, setBuvid3] = useState("")
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/bilibili-credentials")
      if (res.ok) {
        const data = await res.json()
        setHasCredentials(data.hasCredentials)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleTest = async () => {
    if (!(sessdata && biliJct && buvid3)) {
      toast.error(t.settingsBilibili.fillAllFields)
      return
    }

    setTesting(true)
    try {
      const res = await fetch("/api/bilibili-credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessdata, biliJct, buvid3 }),
      })

      const data = await res.json()

      if (data.valid) {
        toast.success(t.settingsBilibili.testSuccess)
      } else {
        toast.error(t.settingsBilibili.invalidCredentials, { description: data.error || data.details })
      }
    } catch {
      toast.error(t.settingsBilibili.testFailed)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!(sessdata && biliJct && buvid3)) {
      toast.error(t.settingsBilibili.fillAllFields)
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/bilibili-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessdata, biliJct, buvid3 }),
      })

      if (res.ok) {
        toast.success(t.settingsBilibili.saveSuccess)
        setShowForm(false)
        setSessdata("")
        setBiliJct("")
        setBuvid3("")
        await fetchStatus()
      } else {
        const data = await res.json()
        toast.error(data.error || t.settingsBilibili.saveFailed)
      }
    } catch {
      toast.error(t.settingsBilibili.saveNetworkFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/bilibili-credentials", {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success(t.settingsBilibili.deleteSuccess)
        await fetchStatus()
      } else {
        const data = await res.json()
        toast.error(data.error || t.settingsBilibili.deleteFailed)
      }
    } catch {
      toast.error(t.settingsBilibili.deleteNetworkFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setSessdata("")
    setBiliJct("")
    setBuvid3("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 font-medium text-sm">{t.settingsBilibili.title}</h3>
        <p className="mb-4 text-muted-foreground text-xs">
          {t.settingsBilibili.description}
        </p>

        {hasCredentials && !showForm && (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-green-600" />
              <span className="text-sm">{t.settingsBilibili.configured}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowForm(true)} size="sm" variant="outline">
                {t.settingsBilibili.update}
              </Button>
              <Button disabled={saving} onClick={handleDelete} size="sm" variant="destructive">
                {t.settingsBilibili.delete}
              </Button>
            </div>
          </div>
        )}

        {(!hasCredentials || showForm) && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                {hasCredentials
                  ? t.settingsBilibili.updateCredentials
                  : t.settingsBilibili.configureCredentials}
              </h4>
              {showForm && (
                <Button onClick={handleCancel} size="sm" variant="ghost">
                  <X className="size-4" />
                </Button>
              )}
            </div>

            <div className="space-y-1.5 rounded-md bg-blue-50 p-3 dark:bg-blue-950">
              <p className="font-medium text-xs">{t.settingsBilibili.howToGetCookie}</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>{t.settingsBilibili.step1}</li>
                <li>{t.settingsBilibili.step2}</li>
                <li>{t.settingsBilibili.step3}</li>
                <li>{t.settingsBilibili.step4}</li>
              </ol>
              <ul className="list-disc list-inside ml-4 text-xs">
                <li>
                  <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">SESSDATA</code>
                </li>
                <li>
                  <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">bili_jct</code>
                </li>
                <li>
                  <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">buvid3</code>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">SESSDATA</Label>
              <Input
                onChange={(e) => setSessdata(e.target.value)}
                placeholder={t.settingsBilibili.sessdataPlaceholder}
                type="password"
                value={sessdata}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">bili_jct</Label>
              <Input
                onChange={(e) => setBiliJct(e.target.value)}
                placeholder={t.settingsBilibili.biliJctPlaceholder}
                type="password"
                value={biliJct}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">buvid3</Label>
              <Input
                onChange={(e) => setBuvid3(e.target.value)}
                placeholder={t.settingsBilibili.buvid3Placeholder}
                type="text"
                value={buvid3}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button disabled={testing || saving} onClick={handleTest} size="sm" variant="outline">
                {testing && <Loader2 className="mr-1 size-3 animate-spin" />}
                {t.settingsBilibili.test}
              </Button>
              <Button disabled={saving || testing} onClick={handleSave} size="sm">
                {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
                {t.settingsBilibili.save}
              </Button>
              {showForm && (
                <Button onClick={handleCancel} size="sm" variant="outline">
                  {t.settingsBilibili.cancel}
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
        <p className="text-xs">
          <strong>{t.settingsBilibili.noteLabel}</strong>
          {t.settingsBilibili.noteContent}
        </p>
      </section>
    </div>
  )
}
