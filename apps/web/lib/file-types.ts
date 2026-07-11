/**
 * 文件类型映射（客户端使用）
 * 与 apps/api 的 EXTENSION_TYPE_MAP 保持一致，用于设置页展示支持的文件类型
 */
import type { BookmarkType } from "@repo/types"

/** 文件扩展名到书签类型的映射 */
export const EXTENSION_TYPE_MAP: Record<string, BookmarkType> = {
  ".pdf": "document",
  ".docx": "document",
  ".doc": "document",
  ".md": "document",
  ".markdown": "document",
  ".xlsx": "spreadsheet",
  ".xls": "spreadsheet",
  ".csv": "spreadsheet",
  ".mp3": "audio",
  ".wav": "audio",
  ".mp4": "video",
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".gif": "image",
  ".webp": "image",
  ".html": "article",
  ".htm": "article",
  ".xml": "article",
  ".ipynb": "document",
  ".zip": "other",
}
