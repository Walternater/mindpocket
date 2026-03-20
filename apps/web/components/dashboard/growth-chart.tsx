"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useLocale, useT } from "@/lib/i18n"

interface GrowthChartProps {
  data: Array<{ date: string; count: number }>
  days: number
  onDaysChange: (days: number) => void
}

export function GrowthChart({ data, days, onDaysChange }: GrowthChartProps) {
  const t = useT()
  const { locale } = useLocale()
  const chartConfig = {
    count: {
      label: t.dashboard.chartCount,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig
  const dayOptions = [
    { label: t.dashboard.day7, value: 7 },
    { label: t.dashboard.day30, value: 30 },
    { label: t.dashboard.day90, value: 90 },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.dashboard.growthTitle}</CardTitle>
            <CardDescription>{t.dashboard.growthDescription}</CardDescription>
          </div>
          <div className="flex gap-1">
            {dayOptions.map((opt) => (
              <button
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  days === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                key={opt.value}
                onClick={() => onDaysChange(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[250px] w-full" config={chartConfig}>
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              tickFormatter={(value: string) => {
                const d = new Date(value)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string) => {
                    return new Date(value).toLocaleDateString(locale === "zh" ? "zh-CN" : "en")
                  }}
                />
              }
            />
            <defs>
              <linearGradient id="fillCount" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="count"
              fill="url(#fillCount)"
              stroke="var(--color-count)"
              strokeWidth={2}
              type="natural"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
