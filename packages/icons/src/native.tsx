import Svg, { Path, type SvgProps } from "react-native-svg"
import type { PlatformKey } from "./shared"
import { hasPlatformIcon as hasPlatformIconBase, PLATFORM_META } from "./shared"

type NativeIconProps = Omit<SvgProps, "color"> & { color?: string }
type NativeIconComponent = (props: NativeIconProps) => React.JSX.Element

function createIcon(path: string, defaultColor: string, label: string): NativeIconComponent {
  return function Icon({ color = defaultColor, ...props }: NativeIconProps) {
    return (
      <Svg accessibilityLabel={label} viewBox="0 0 24 24" {...props}>
        <Path d={path} fill={color} />
      </Svg>
    )
  }
}

export const WechatIcon = createIcon(
  PLATFORM_META.wechat.path,
  PLATFORM_META.wechat.color,
  PLATFORM_META.wechat.label
)
export const XiaohongshuIcon = createIcon(
  PLATFORM_META.xiaohongshu.path,
  PLATFORM_META.xiaohongshu.color,
  PLATFORM_META.xiaohongshu.label
)
export const ZhihuIcon = createIcon(
  PLATFORM_META.zhihu.path,
  PLATFORM_META.zhihu.color,
  PLATFORM_META.zhihu.label
)
export const TwitterIcon = createIcon(
  PLATFORM_META.twitter.path,
  PLATFORM_META.twitter.color,
  PLATFORM_META.twitter.label
)
export const GithubIcon = createIcon(
  PLATFORM_META.github.path,
  PLATFORM_META.github.color,
  PLATFORM_META.github.label
)
export const YoutubeIcon = createIcon(
  PLATFORM_META.youtube.path,
  PLATFORM_META.youtube.color,
  PLATFORM_META.youtube.label
)
export const BilibiliIcon = createIcon(
  PLATFORM_META.bilibili.path,
  PLATFORM_META.bilibili.color,
  PLATFORM_META.bilibili.label
)
export const MediumIcon = createIcon(
  PLATFORM_META.medium.path,
  PLATFORM_META.medium.color,
  PLATFORM_META.medium.label
)
export const RedditIcon = createIcon(
  PLATFORM_META.reddit.path,
  PLATFORM_META.reddit.color,
  PLATFORM_META.reddit.label
)
export const JuejinIcon = createIcon(
  PLATFORM_META.juejin.path,
  PLATFORM_META.juejin.color,
  PLATFORM_META.juejin.label
)
export const JianshuIcon = createIcon(
  PLATFORM_META.jianshu.path,
  PLATFORM_META.jianshu.color,
  PLATFORM_META.jianshu.label
)
export const NotionIcon = createIcon(
  PLATFORM_META.notion.path,
  PLATFORM_META.notion.color,
  PLATFORM_META.notion.label
)
export const ArxivIcon = createIcon(
  PLATFORM_META.arxiv.path,
  PLATFORM_META.arxiv.color,
  PLATFORM_META.arxiv.label
)
export const StackoverflowIcon = createIcon(
  PLATFORM_META.stackoverflow.path,
  PLATFORM_META.stackoverflow.color,
  PLATFORM_META.stackoverflow.label
)
export const QQIcon = createIcon(
  PLATFORM_META.qq.path,
  PLATFORM_META.qq.color,
  PLATFORM_META.qq.label
)

export const PLATFORM_CONFIG: Record<
  PlatformKey,
  { color: string; icon: NativeIconComponent; label: string }
> = {
  wechat: {
    color: PLATFORM_META.wechat.color,
    icon: WechatIcon,
    label: PLATFORM_META.wechat.label,
  },
  xiaohongshu: {
    color: PLATFORM_META.xiaohongshu.color,
    icon: XiaohongshuIcon,
    label: PLATFORM_META.xiaohongshu.label,
  },
  zhihu: { color: PLATFORM_META.zhihu.color, icon: ZhihuIcon, label: PLATFORM_META.zhihu.label },
  twitter: {
    color: PLATFORM_META.twitter.color,
    icon: TwitterIcon,
    label: PLATFORM_META.twitter.label,
  },
  github: {
    color: PLATFORM_META.github.color,
    icon: GithubIcon,
    label: PLATFORM_META.github.label,
  },
  youtube: {
    color: PLATFORM_META.youtube.color,
    icon: YoutubeIcon,
    label: PLATFORM_META.youtube.label,
  },
  bilibili: {
    color: PLATFORM_META.bilibili.color,
    icon: BilibiliIcon,
    label: PLATFORM_META.bilibili.label,
  },
  medium: {
    color: PLATFORM_META.medium.color,
    icon: MediumIcon,
    label: PLATFORM_META.medium.label,
  },
  reddit: {
    color: PLATFORM_META.reddit.color,
    icon: RedditIcon,
    label: PLATFORM_META.reddit.label,
  },
  juejin: {
    color: PLATFORM_META.juejin.color,
    icon: JuejinIcon,
    label: PLATFORM_META.juejin.label,
  },
  jianshu: {
    color: PLATFORM_META.jianshu.color,
    icon: JianshuIcon,
    label: PLATFORM_META.jianshu.label,
  },
  notion: {
    color: PLATFORM_META.notion.color,
    icon: NotionIcon,
    label: PLATFORM_META.notion.label,
  },
  arxiv: { color: PLATFORM_META.arxiv.color, icon: ArxivIcon, label: PLATFORM_META.arxiv.label },
  stackoverflow: {
    color: PLATFORM_META.stackoverflow.color,
    icon: StackoverflowIcon,
    label: PLATFORM_META.stackoverflow.label,
  },
  qq: { color: PLATFORM_META.qq.color, icon: QQIcon, label: PLATFORM_META.qq.label },
}

export function PlatformIcon({
  color,
  platform,
  size = 14,
  ...props
}: { platform: string; size?: number } & NativeIconProps) {
  if (!hasPlatformIconBase(platform)) {
    return null
  }

  const config = PLATFORM_CONFIG[platform]
  const Icon = config.icon

  return <Icon color={color ?? config.color} height={size} width={size} {...props} />
}

export const hasPlatformIcon = hasPlatformIconBase
export type { PlatformKey } from "./shared"
