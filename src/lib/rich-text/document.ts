import type { JSONContent } from "@tiptap/core"

export type RichTextDocument = JSONContent & { type: "doc" }

export const EMPTY_RICH_TEXT_DOCUMENT: RichTextDocument = {
  type: "doc",
  content: [],
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

const isDocContent = (value: unknown): value is JSONContent[] =>
  Array.isArray(value)

export const isRichTextDocument = (
  value: unknown,
): value is RichTextDocument => {
  const asObject = asRecord(value)
  if (!asObject) {
    return false
  }
  if (asObject.type !== "doc") {
    return false
  }
  const content = asObject.content
  return content === undefined || isDocContent(content)
}

const normalizeWhitespace = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim()

export const plainTextToRichTextDocument = (
  value: string,
): RichTextDocument => {
  const normalized = normalizeWhitespace(value)
  if (!normalized) {
    return EMPTY_RICH_TEXT_DOCUMENT
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return EMPTY_RICH_TEXT_DOCUMENT
  }

  return {
    type: "doc",
    content: paragraphs.map((paragraph) => {
      const lines = paragraph.split("\n")
      const content: JSONContent[] = []
      lines.forEach((line, index) => {
        if (line) {
          content.push({ type: "text", text: line })
        }
        if (index < lines.length - 1) {
          content.push({ type: "hardBreak" })
        }
      })
      return { type: "paragraph", content }
    }),
  }
}

export const parseRichTextDocumentString = (
  value: string,
): RichTextDocument | null => {
  const raw = value.trim()
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    return isRichTextDocument(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const extractPlainTextFromRichText = (value: unknown): string => {
  if (!value) {
    return ""
  }
  if (typeof value === "string") {
    return value
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => extractPlainTextFromRichText(entry))
      .join("")
      .trim()
  }
  if (typeof value === "object") {
    const node = value as Record<string, unknown>
    const nodeType = typeof node.type === "string" ? node.type : ""
    const text = typeof node.text === "string" ? node.text : ""
    const content = extractPlainTextFromRichText(node.content)
    if (nodeType === "paragraph") {
      return `${text}${content}\n\n`
    }
    if (nodeType === "hardBreak") {
      return "\n"
    }
    return `${text}${content}`
  }
  return ""
}

export const toRichTextDocumentString = (value: unknown): string => {
  if (isRichTextDocument(value)) {
    return JSON.stringify(value)
  }
  return JSON.stringify(EMPTY_RICH_TEXT_DOCUMENT)
}
