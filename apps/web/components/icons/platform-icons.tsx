import { PlatformIcon as BasePlatformIcon, hasPlatformIcon, PLATFORM_CONFIG } from "@repo/icons/web"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// biome-ignore lint/performance/noBarrelFile: This module intentionally re-exports shared icon symbols and adds a web-only tooltip wrapper.
export {
  ArxivIcon,
  BilibiliIcon,
  GithubIcon,
  hasPlatformIcon,
  JianshuIcon,
  JuejinIcon,
  MediumIcon,
  NotionIcon,
  PLATFORM_CONFIG,
  QQIcon,
  RedditIcon,
  StackoverflowIcon,
  TwitterIcon,
  WechatIcon,
  XiaohongshuIcon,
  YoutubeIcon,
  ZhihuIcon,
} from "@repo/icons/web"

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  if (!hasPlatformIcon(platform)) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <BasePlatformIcon className={className} platform={platform} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{PLATFORM_CONFIG[platform].label}</TooltipContent>
    </Tooltip>
  )
}
