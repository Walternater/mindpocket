// biome-ignore lint/performance/noBarrelFile: This package entrypoint intentionally defines the public API surface.
export {
  detectPlatform,
  getPlatformMeta,
  hasPlatformIcon,
  PLATFORM_KEYS,
  PLATFORM_META,
  type PlatformKey,
  type PlatformMeta,
} from "./shared"
