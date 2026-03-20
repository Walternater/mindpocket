"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useT } from "@/lib/i18n"

interface FolderRankingProps {
  data: Array<{ name: string; emoji: string; count: number }>
}

export function FolderRanking({ data }: FolderRankingProps) {
  const t = useT()
  const chartConfig = {
    count: {
      label: t.dashboard.chartCount,
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig
  const chartData = data.map((item) => ({
    name: `${item.emoji} ${item.name}`,
    count: item.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.folderRankingTitle}</CardTitle>
        <CardDescription>{t.dashboard.folderRankingDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[250px] w-full" config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} layout="vertical">
            <YAxis
              axisLine={false}
              dataKey="name"
              tickFormatter={(value: string) =>
                value.length > 10 ? `${value.slice(0, 10)}...` : value
              }
              tickLine={false}
              type="category"
              width={120}
            />
            <XAxis hide type="number" />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
