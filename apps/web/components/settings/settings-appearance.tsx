"use client"

import type { ViewMode } from "@repo/types"
import { Grid3X3, LayoutList, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores"

export function SettingsAppearance() {
  const t = useT()
  const { theme, setTheme } = useTheme()
  const bookmarkViewMode = useUIStore((s) => s.bookmarkViewMode)
  const setBookmarkViewMode = useUIStore((s) => s.setBookmarkViewMode)

  const themes = [
    {
      value: "light",
      label: t.settings.themeLight,
      icon: Sun,
      preview: { bg: "#ffffff", sidebar: "#fafafa", text: "#e5e5e5" },
    },
    {
      value: "dark",
      label: t.settings.themeDark,
      icon: Moon,
      preview: { bg: "#1a1a1a", sidebar: "#262626", text: "#404040" },
    },
    {
      value: "system",
      label: t.settings.themeSystem,
      icon: Monitor,
      preview: { bg: "#ffffff", sidebar: "#1a1a1a", text: "#e5e5e5" },
    },
  ] as const

  return (
    <div className="space-y-6">
      <h3 className="font-medium text-sm">{t.settings.theme}</h3>
      <div className="grid grid-cols-3 gap-4">
        {themes.map((item) => (
          <button
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors",
              theme === item.value
                ? "border-primary"
                : "border-transparent hover:border-muted-foreground/25"
            )}
            key={item.value}
            onClick={() => setTheme(item.value)}
            type="button"
          >
            <div className="w-full overflow-hidden rounded-md border">
              <div className="flex h-16" style={{ backgroundColor: item.preview.bg }}>
                <div
                  className="w-1/3 border-r p-1.5"
                  style={{ backgroundColor: item.preview.sidebar }}
                >
                  <div
                    className="mb-1 h-1.5 w-full rounded-sm"
                    style={{ backgroundColor: item.preview.text }}
                  />
                  <div
                    className="mb-1 h-1.5 w-3/4 rounded-sm"
                    style={{ backgroundColor: item.preview.text }}
                  />
                  <div
                    className="h-1.5 w-1/2 rounded-sm"
                    style={{ backgroundColor: item.preview.text }}
                  />
                </div>
                <div className="flex-1 p-1.5">
                  <div
                    className="mb-1 h-1.5 w-3/4 rounded-sm"
                    style={{ backgroundColor: item.preview.text }}
                  />
                  <div
                    className="h-1.5 w-1/2 rounded-sm"
                    style={{ backgroundColor: item.preview.text }}
                  />
                </div>
              </div>
            </div>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 收藏视图模式选择 */}
      <h3 className="font-medium text-sm">{t.settings.bookmarkView}</h3>
      <div className="grid grid-cols-2 gap-4">
        {[
          { value: "grid" as ViewMode, label: t.settings.viewGrid, icon: Grid3X3 },
          { value: "list" as ViewMode, label: t.settings.viewList, icon: LayoutList },
        ].map((item) => (
          <button
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors",
              bookmarkViewMode === item.value
                ? "border-primary"
                : "border-transparent hover:border-muted-foreground/25"
            )}
            key={item.value}
            onClick={() => setBookmarkViewMode(item.value)}
            type="button"
          >
            <div className="flex h-16 w-full items-center justify-center rounded-md border bg-muted/30">
              <item.icon className="size-8 text-muted-foreground" />
            </div>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
