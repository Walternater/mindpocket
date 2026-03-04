"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSiteI18n } from "@/lib/site-i18n"
import { GitHubStar } from "./github-star"

const GITHUB_REPO = "https://github.com/jihe520/mindpocket"

export default function CallToAction() {
  const { t } = useSiteI18n()

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl rounded-3xl border px-6 py-12 md:py-20 lg:py-32">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">{t.cta.title}</h2>
          <p className="mt-4">{t.cta.subtitle}</p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href={GITHUB_REPO}>
                <GitHubStar />
                <span>{t.cta.primary}</span>
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link href={GITHUB_REPO}>
                <span>{t.cta.secondary}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
