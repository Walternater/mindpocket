/**
 * 浏览器端 PDF 文本提取
 * 后端（Cloudflare Workers）只能解析纯文本类文件，
 * PDF 在上传前于浏览器内用 pdfjs-dist 提取全文，随 FormData 附带 markdown 字段。
 */

/** 判断是否为 PDF 文件 */
export function isPdfFile(file: File) {
  return file.name.toLowerCase().endsWith(".pdf")
}

/** 提取 PDF 全文文本（按页拼接） */
export async function extractPdfText(file: File): Promise<string> {
  // 动态 import，避免 pdfjs 进入主 bundle
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()

  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
  try {
    const pages: string[] = []
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const content = await page.getTextContent()
      // TextItem 才有 str 字段（TextMarkedContent 没有）
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim()
      if (text) {
        pages.push(text)
      }
    }
    return pages.join("\n\n").trim()
  } finally {
    await doc.destroy()
  }
}

/**
 * 若文件为 PDF，则解析文本并附加到 FormData 的 markdown 字段。
 * 解析失败不阻断上传（由服务端标记失败原因）。
 */
export async function appendPdfMarkdown(formData: FormData, file: File) {
  if (!isPdfFile(file)) {
    return
  }
  try {
    const markdown = await extractPdfText(file)
    if (markdown) {
      formData.append("markdown", markdown)
    }
  } catch {
    // 解析失败时静默跳过，交由服务端处理
  }
}
