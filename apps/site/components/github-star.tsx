"use client"

import { Star } from "lucide-react"
import { useEffect, useState } from "react"

const GITHUB_REPO = "jihe520/mindpocket"

export function GitHubStar() {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count))
      .catch(() => setStars(null))
  }, [])

  return (
    <div className="flex items-center gap-1.5">
      <Star className="size-4" />
      <span>{typeof stars === 'number' ? stars.toLocaleString() : "..."}</span>
    </div>
  )
}
