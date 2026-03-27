"use client"

import Image from "next/image"
import { useSiteI18n } from "@/lib/site-i18n"

export default function ContentSection() {
  const { t } = useSiteI18n()
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
          {t.content.title}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative mb-6 sm:mb-0">
            <div className="bg-linear-to-b aspect-76/59 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
              <Image
                alt="MindPocket web preview"
                className="rounded-[15px] shadow"
                height={929}
                src="/marketing/pic/web.png"
                width={1207}
              />
            </div>
          </div>

          <div className="relative space-y-4">
            <p className="text-muted-foreground">{t.content.paragraph1}</p>
            <p className="text-muted-foreground">{t.content.paragraph2}</p>

            <div className="pt-6">
              <blockquote className="border-l-4 pl-4">
                <p>{t.content.quote}</p>

                <div className="mt-6 space-y-3">
                  <cite className="block font-medium">{t.content.author}</cite>
                  <p className="text-sm text-muted-foreground">{t.content.authorRole}</p>
                </div>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
