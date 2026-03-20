import type { SVGProps } from "react"
import type { PlatformKey } from "./shared"
import {
  detectPlatform as detectPlatformBase,
  hasPlatformIcon as hasPlatformIconBase,
  PLATFORM_META,
} from "./shared"

type IconProps = SVGProps<SVGSVGElement>
type WebIconComponent = (props: IconProps) => React.JSX.Element

function createIcon(path: string, label: string): WebIconComponent {
  return function Icon(props: IconProps) {
    return (
      <svg
        aria-hidden="true"
        fill="currentColor"
        focusable="false"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <title>{label}</title>
        <path d={path} />
      </svg>
    )
  }
}

export const WechatIcon = createIcon(PLATFORM_META.wechat.path, PLATFORM_META.wechat.label)
export const XiaohongshuIcon = createIcon(
  PLATFORM_META.xiaohongshu.path,
  PLATFORM_META.xiaohongshu.label
)
export const ZhihuIcon = createIcon(PLATFORM_META.zhihu.path, PLATFORM_META.zhihu.label)
export const TwitterIcon = createIcon(PLATFORM_META.twitter.path, PLATFORM_META.twitter.label)
export const GithubIcon = createIcon(PLATFORM_META.github.path, PLATFORM_META.github.label)
export const YoutubeIcon = createIcon(PLATFORM_META.youtube.path, PLATFORM_META.youtube.label)
export const BilibiliIcon = createIcon(PLATFORM_META.bilibili.path, PLATFORM_META.bilibili.label)
export const MediumIcon = createIcon(PLATFORM_META.medium.path, PLATFORM_META.medium.label)
export const RedditIcon = createIcon(PLATFORM_META.reddit.path, PLATFORM_META.reddit.label)
export const JuejinIcon = createIcon(PLATFORM_META.juejin.path, PLATFORM_META.juejin.label)
export const JianshuIcon = createIcon(PLATFORM_META.jianshu.path, PLATFORM_META.jianshu.label)
export const NotionIcon = createIcon(PLATFORM_META.notion.path, PLATFORM_META.notion.label)
export const ArxivIcon = createIcon(PLATFORM_META.arxiv.path, PLATFORM_META.arxiv.label)
export const StackoverflowIcon = createIcon(
  PLATFORM_META.stackoverflow.path,
  PLATFORM_META.stackoverflow.label
)
export const QQIcon = createIcon(PLATFORM_META.qq.path, PLATFORM_META.qq.label)

export const PLATFORM_CONFIG: Record<
  PlatformKey,
  { color: string; colorHex: string; icon: WebIconComponent; label: string }
> = {
  wechat: {
    color: PLATFORM_META.wechat.colorClassName,
    colorHex: PLATFORM_META.wechat.color,
    icon: WechatIcon,
    label: PLATFORM_META.wechat.label,
  },
  xiaohongshu: {
    color: PLATFORM_META.xiaohongshu.colorClassName,
    colorHex: PLATFORM_META.xiaohongshu.color,
    icon: XiaohongshuIcon,
    label: PLATFORM_META.xiaohongshu.label,
  },
  zhihu: {
    color: PLATFORM_META.zhihu.colorClassName,
    colorHex: PLATFORM_META.zhihu.color,
    icon: ZhihuIcon,
    label: PLATFORM_META.zhihu.label,
  },
  twitter: {
    color: PLATFORM_META.twitter.colorClassName,
    colorHex: PLATFORM_META.twitter.color,
    icon: TwitterIcon,
    label: PLATFORM_META.twitter.label,
  },
  github: {
    color: PLATFORM_META.github.colorClassName,
    colorHex: PLATFORM_META.github.color,
    icon: GithubIcon,
    label: PLATFORM_META.github.label,
  },
  youtube: {
    color: PLATFORM_META.youtube.colorClassName,
    colorHex: PLATFORM_META.youtube.color,
    icon: YoutubeIcon,
    label: PLATFORM_META.youtube.label,
  },
  bilibili: {
    color: PLATFORM_META.bilibili.colorClassName,
    colorHex: PLATFORM_META.bilibili.color,
    icon: BilibiliIcon,
    label: PLATFORM_META.bilibili.label,
  },
  medium: {
    color: PLATFORM_META.medium.colorClassName,
    colorHex: PLATFORM_META.medium.color,
    icon: MediumIcon,
    label: PLATFORM_META.medium.label,
  },
  reddit: {
    color: PLATFORM_META.reddit.colorClassName,
    colorHex: PLATFORM_META.reddit.color,
    icon: RedditIcon,
    label: PLATFORM_META.reddit.label,
  },
  juejin: {
    color: PLATFORM_META.juejin.colorClassName,
    colorHex: PLATFORM_META.juejin.color,
    icon: JuejinIcon,
    label: PLATFORM_META.juejin.label,
  },
  jianshu: {
    color: PLATFORM_META.jianshu.colorClassName,
    colorHex: PLATFORM_META.jianshu.color,
    icon: JianshuIcon,
    label: PLATFORM_META.jianshu.label,
  },
  notion: {
    color: PLATFORM_META.notion.colorClassName,
    colorHex: PLATFORM_META.notion.color,
    icon: NotionIcon,
    label: PLATFORM_META.notion.label,
  },
  arxiv: {
    color: PLATFORM_META.arxiv.colorClassName,
    colorHex: PLATFORM_META.arxiv.color,
    icon: ArxivIcon,
    label: PLATFORM_META.arxiv.label,
  },
  stackoverflow: {
    color: PLATFORM_META.stackoverflow.colorClassName,
    colorHex: PLATFORM_META.stackoverflow.color,
    icon: StackoverflowIcon,
    label: PLATFORM_META.stackoverflow.label,
  },
  qq: {
    color: PLATFORM_META.qq.colorClassName,
    colorHex: PLATFORM_META.qq.color,
    icon: QQIcon,
    label: PLATFORM_META.qq.label,
  },
}

export function PlatformIcon({
  platform,
  className,
  ...props
}: { platform: string; className?: string } & IconProps) {
  if (!hasPlatformIconBase(platform)) {
    return null
  }

  const config = PLATFORM_CONFIG[platform]
  const Icon = config.icon

  return <Icon className={className ?? `size-3.5 shrink-0 ${config.color}`} {...props} />
}

export const detectPlatform = detectPlatformBase
export const hasPlatformIcon = hasPlatformIconBase
export type { PlatformKey } from "./shared"
