// biome-ignore-all lint/performance/noBarrelFile: package entrypoint re-exports site/web dictionaries
export type { Locale } from "./shared"
export type { SiteTranslationDict } from "./site"
export { getSiteDictionary, siteDictionaries } from "./site"
export type { WebTranslationDict } from "./web"
export { getWebDictionary, webDictionaries } from "./web"
