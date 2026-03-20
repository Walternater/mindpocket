"use client"

import { useMemo } from "react"
import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useT } from "@/lib/i18n"

interface TypeDistributionProps {
  data: Array<{ type: string; count: number }>
}

const typeColors: Record<string, string> = {
  link: "hsl(var(--chart-1))",
  text: "hsl(var(--chart-2))",
  image: "hsl(var(--chart-3))",
  video: "hsl(var(--chart-4))",
  audio: "hsl(var(--chart-5))",
  pdf: "hsl(var(--chart-1))",
}

export function TypeDistribution({ data }: TypeDistributionProps) {
  const t = useT()
  const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data])
  const typeLabels: Record<string, string> = {
    link: t.bookmarkList.typeLink,
    text: t.dashboard.typeText,
    image: t.bookmarkList.typeImage,
    video: t.bookmarkList.typeVideo,
    audio: t.dashboard.typeAudio,
    pdf: t.dashboard.typePdf,
  }

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    for (const item of data) {
      config[item.type] = {
        label: typeLabels[item.type] || item.type,
        color: typeColors[item.type] || "hsl(var(--chart-1))",
      }
    }
    return config
  }, [data, typeLabels])

  const chartData = useMemo(
    () => data.map((item) => ({ ...item, fill: `var(--color-${item.type})` })),
    [data]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.typeDistributionTitle}</CardTitle>
        <CardDescription>{t.dashboard.typeDistributionDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="mx-auto h-[250px]" config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Pie data={chartData} dataKey="count" innerRadius={60} nameKey="type" strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        dominantBaseline="middle"
                        textAnchor="middle"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        <tspan
                          className="fill-foreground text-3xl font-bold"
                          x={viewBox.cx}
                          y={viewBox.cy}
                        >
                          {total}
                        </tspan>
                        <tspan
                          className="fill-muted-foreground"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                        >
                          {t.dashboard.totalCenterLabel}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
