"use client"

import { ArrowRight, FileText, Link2, MoreHorizontal } from "lucide-react"
import type { Variants } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import type React from "react"
import { useState } from "react"
import { AnimatedGroup } from "@/components/ui/animated-group"
import { Button } from "@/components/ui/button"
import { TextEffect } from "@/components/ui/text-effect"
import { useSiteI18n } from "@/lib/site-i18n"
import { GitHubStar } from "./github-star"
import { HeroHeader } from "./header"

const GITHUB_REPO = "https://github.com/jihe520/mindpocket"

const transitionVariants: { item: Variants } = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
}

export default function HeroSection() {
  const [previewMode, setPreviewMode] = useState<"web" | "mobile">("web")
  const { t } = useSiteI18n()

  return (
    <>
      <HeroHeader onPreviewModeChange={setPreviewMode} previewMode={previewMode} />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-20 lg:top-32"
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                } satisfies Variants,
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                } satisfies Variants,
              }}
            >
              <Image
                alt="background"
                className="hidden size-full dark:block"
                height="4095"
                src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                width="3276"
              />
            </AnimatedGroup>

            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
            />

            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                    href="#link"
                  >
                    <span className="text-foreground text-sm">{t.hero.badge}</span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700" />

                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedGroup>

                <TextEffect
                  as="h1"
                  className="mx-auto mt-8 max-w-4xl text-balance text-5xl max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                >
                  {t.hero.title}
                </TextEffect>
                <TextEffect
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-balance text-lg"
                  delay={0.5}
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                >
                  {t.hero.subtitle}
                </TextEffect>

                <AnimatedGroup
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                >
                  <div
                    className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
                    key={1}
                  >
                    <Button asChild className="rounded-xl px-5 text-base" size="lg">
                      <Link href={GITHUB_REPO}>
                        <GitHubStar />
                        <span className="text-nowrap">{t.hero.primaryCta}</span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    asChild
                    className="h-10.5 rounded-xl px-5"
                    key={2}
                    size="lg"
                    variant="ghost"
                  >
                    <Link href={GITHUB_REPO}>
                      <span className="text-nowrap">{t.hero.secondaryCta}</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                {previewMode === "web" ? (
                  <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                    <Image
                      alt="web app screen"
                      className="z-2 border-border/25 bg-background aspect-15/8 relative rounded-2xl border"
                      height="1440"
                      src="/marketing/pic/web.png"
                      width="2700"
                    />
                  </div>
                ) : (
                  <div
                    aria-hidden
                    className="bg-radial from-primary/50 dark:from-primary/25 relative mx-auto mt-4 max-w-2xl to-transparent to-55% text-left"
                  >
                    <div className="bg-background border-border/50 absolute inset-0 mx-auto w-80 -translate-x-3 -translate-y-12 rounded-[2rem] border p-2 [mask-image:linear-gradient(to_bottom,#000_50%,transparent_90%)] sm:-translate-x-6">
                      <div className="relative h-96 overflow-hidden rounded-[1.5rem] border p-2 pb-12 before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_6px)] before:opacity-50" />
                    </div>
                    <div className="bg-muted dark:bg-background/50 border-border/50 mx-auto w-80 translate-x-4 rounded-[2rem] border p-2 backdrop-blur-3xl [mask-image:linear-gradient(to_bottom,#000_50%,transparent_90%)] sm:translate-x-8">
                      <div className="bg-background space-y-2 overflow-hidden rounded-[1.5rem] border p-2 shadow-xl dark:bg-white/5 dark:shadow-black dark:backdrop-blur-3xl">
                        <MobileStatsCard />
                        <div className="bg-muted rounded-[1rem] p-3 pb-6 dark:bg-white/5">
                          <MobileBookmarkPreview />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] mix-blend-overlay [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:opacity-5" />
                  </div>
                )}
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  )
}

const MobileStatsCard = () => {
  const { t } = useSiteI18n()
  return (
    <div className="relative space-y-3 rounded-[1rem] bg-white/5 p-4">
      <div className="flex items-center gap-1.5 text-orange-400">
        <svg className="size-5" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <title>已保存链接趋势</title>
          <g fill="none">
            <path
              d="M26 19.34c0 6.1-5.05 11.005-11.15 10.641c-6.269-.374-10.56-6.403-9.752-12.705c.489-3.833 2.286-7.12 4.242-9.67c.34-.445.689 3.136 1.038 2.742c.35-.405 3.594-6.019 4.722-7.991a.694.694 0 0 1 1.028-.213C18.394 3.854 26 10.277 26 19.34"
              fill="#ff6723"
            />
            <path
              d="M23 21.851c0 4.042-3.519 7.291-7.799 7.144c-4.62-.156-7.788-4.384-7.11-8.739C9.07 14.012 15.48 10 15.48 10S23 14.707 23 21.851"
              fill="#ffb02e"
            />
          </g>
        </svg>
        <div className="text-sm font-medium">{t.hero.savedLinks}</div>
      </div>
      <div className="space-y-3">
        <div className="text-foreground border-b border-white/10 pb-3 text-sm font-medium">
          {t.hero.savingTrend}
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="space-x-1">
              <span className="text-foreground align-baseline text-xl font-medium">128</span>
              <span className="text-muted-foreground text-xs">{t.hero.savesPerWeek}</span>
            </div>
            <div className="flex h-5 items-center rounded bg-gradient-to-l from-emerald-400 to-indigo-600 px-2 text-xs text-white">
              2026
            </div>
          </div>
          <div className="space-y-1">
            <div className="space-x-1">
              <span className="text-foreground align-baseline text-xl font-medium">74</span>
              <span className="text-muted-foreground text-xs">{t.hero.savesPerWeek}</span>
            </div>
            <div className="text-foreground bg-muted flex h-5 w-2/3 items-center rounded px-2 text-xs dark:bg-white/20">
              2025
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MobileBookmarkPreview = () => {
  const { t } = useSiteI18n()
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <span className="rounded-md bg-accent px-2 py-0.5 text-[11px]">{t.hero.all}</span>
        <span className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground">
          {t.hero.links}
        </span>
        <span className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground">
          {t.hero.articles}
        </span>
      </div>
      <MobileBookmarkItem
        icon={<Link2 className="size-3.5 text-muted-foreground" />}
        meta={t.hero.item1Meta}
        title={t.hero.item1Title}
      />
      <MobileBookmarkItem
        icon={<FileText className="size-3.5 text-muted-foreground" />}
        meta={t.hero.item2Meta}
        title={t.hero.item2Title}
      />
    </div>
  )
}

const MobileBookmarkItem = ({
  icon,
  title,
  meta,
}: {
  icon: React.ReactNode
  title: string
  meta: string
}) => {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card px-2.5 py-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
      </div>
      <button
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground"
        type="button"
      >
        <MoreHorizontal className="size-3.5" />
      </button>
    </div>
  )
}
