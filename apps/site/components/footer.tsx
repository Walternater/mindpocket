"use client"

import { BilibiliIcon, GithubIcon, QQIcon, TwitterIcon, XiaohongshuIcon } from "@repo/icons/web"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { useSiteI18n } from "@/lib/site-i18n"

const GITHUB_URL = "https://github.com/jihe520/mindpocket"
const X_URL = "https://x.com/EqbymCi"
const XIAOHONGSHU_URL = "https://www.xiaohongshu.com/user/profile/647a0857000000002a037c03"
const BILIBILI_URL = "https://space.bilibili.com/400340982"
const QQ_GROUP_URL = "https://qm.qq.com/q/jSXw3cyi8U"

export default function FooterSection() {
  const { t } = useSiteI18n()

  const links = t.footer.links.map((title) => ({ title, href: "#" }))
  const socialLinks = [
    { label: "GitHub", href: GITHUB_URL, icon: GithubIcon },
    { label: "X", href: X_URL, icon: TwitterIcon },
    { label: "小红书", href: XIAOHONGSHU_URL, icon: XiaohongshuIcon },
    { label: "哔哩哔哩", href: BILIBILI_URL, icon: BilibiliIcon },
    { label: "QQ群", href: QQ_GROUP_URL, icon: QQIcon },
  ]

  return (
    <footer className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <Link aria-label="go home" className="mx-auto block size-fit" href="/">
          <Logo />
        </Link>

        <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              className="text-muted-foreground hover:text-primary block duration-150"
              href={link.href}
              key={link.title}
            >
              <span>{link.title}</span>
            </Link>
          ))}
        </div>

        <div className="my-6 flex justify-center gap-4">
          {socialLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                aria-label={item.label}
                className="text-muted-foreground hover:text-primary transition-colors"
                href={item.href}
                key={item.label}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Icon className="size-5" />
              </Link>
            )
          })}
        </div>

        <span className="text-muted-foreground block text-center text-sm">
          © {new Date().getFullYear()} {t.footer.copyright}
        </span>
      </div>
    </footer>
  )
}
