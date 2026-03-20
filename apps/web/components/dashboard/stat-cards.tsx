"use client"

import { Bookmark, BrainCircuit, MessageSquare, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useT } from "@/lib/i18n"

interface StatCardsProps {
  totalBookmarks: number
  weekBookmarks: number
  totalChats: number
  embeddingRate: number
}

export function StatCards({
  totalBookmarks,
  weekBookmarks,
  totalChats,
  embeddingRate,
}: StatCardsProps) {
  const t = useT()
  const cards = [
    {
      title: t.dashboard.totalBookmarks,
      value: totalBookmarks,
      icon: Bookmark,
      description: t.dashboard.totalBookmarksDescription,
    },
    {
      title: t.dashboard.weekBookmarks,
      value: weekBookmarks,
      icon: TrendingUp,
      description: t.dashboard.weekBookmarksDescription,
    },
    {
      title: t.dashboard.totalChats,
      value: totalChats,
      icon: MessageSquare,
      description: t.dashboard.totalChatsDescription,
    },
    {
      title: t.dashboard.embeddingRate,
      value: `${embeddingRate}%`,
      icon: BrainCircuit,
      description: t.dashboard.embeddingRateDescription,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-muted-foreground text-xs">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
