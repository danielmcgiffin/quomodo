import sanitizeHtml from "sanitize-html"
import {
  EMPTY_RICH_TEXT_DOCUMENT,
  extractPlainTextFromRichText,
  isRichTextDocument,
  parseRichTextDocumentString,
  plainTextToRichTextDocument,
  toRichTextDocumentString,
  type RichTextDocument,
} from "$lib/rich-text/document"

const allowedTags = [
  "p",
  "br",
  "strong",
  "em",
  "s",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
]

const htmlLooksLikeMarkup = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const toLegacyText = (value: string) =>
  sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()

const renderRichNodes = (nodes: unknown): string => {
  if (!Array.isArray(nodes)) {
    return ""
  }
  return nodes.map((node) => renderRichNode(node)).join("")
}

const renderRichMark = (value: string, mark: unknown): string => {
  if (!mark || typeof mark !== "object") {
    return value
  }

  const typedMark = mark as {
    type?: string
    attrs?: Record<string, unknown>
  }

  switch (typedMark.type) {
    case "bold":
      return `<strong>${value}</strong>`
    case "italic":
      return `<em>${value}</em>`
    case "strike":
      return `<s>${value}</s>`
    case "code":
      return `<code>${value}</code>`
    case "link": {
      const hrefRaw = typedMark.attrs?.href
      const href = typeof hrefRaw === "string" ? escapeHtml(hrefRaw) : ""
      return `<a href="${href}">${value}</a>`
    }
    default:
      return value
  }
}

const renderRichNode = (node: unknown): string => {
  if (!node || typeof node !== "object") {
    return ""
  }

  const typedNode = node as {
    type?: string
    text?: unknown
    marks?: unknown[]
    content?: unknown[]
  }
  const content = typedNode.content ?? []

  switch (typedNode.type) {
    case "doc":
      return renderRichNodes(content)
    case "paragraph":
      return `<p>${renderRichNodes(content)}</p>`
    case "blockquote":
      return `<blockquote>${renderRichNodes(content)}</blockquote>`
    case "bulletList":
      return `<ul>${renderRichNodes(content)}</ul>`
    case "orderedList":
      return `<ol>${renderRichNodes(content)}</ol>`
    case "listItem":
      return `<li>${renderRichNodes(content)}</li>`
    case "hardBreak":
      return "<br>"
    case "image": {
      const typedImage = node as { attrs?: Record<string, unknown> }
      const srcRaw = typedImage.attrs?.src
      const src = typeof srcRaw === "string" ? escapeHtml(srcRaw) : ""
      const altRaw = typedImage.attrs?.alt
      const alt = typeof altRaw === "string" ? escapeHtml(altRaw) : ""
      return `<img src="${src}" alt="${alt}" class="sc-rich-image">`
    }
    case "text": {
      const text = escapeHtml(
        typeof typedNode.text === "string" ? typedNode.text : "",
      )
      const marks = Array.isArray(typedNode.marks) ? typedNode.marks : []
      return marks.reduce<string>(
        (current, mark) => renderRichMark(current, mark),
        text,
      )
    }
    default:
      return renderRichNodes(content)
  }
}

export const normalizeRichTextDocument = (value: unknown): RichTextDocument => {
  if (isRichTextDocument(value)) {
    return value
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return EMPTY_RICH_TEXT_DOCUMENT
    }

    const parsed = parseRichTextDocumentString(trimmed)
    if (parsed) {
      return parsed
    }

    if (htmlLooksLikeMarkup(trimmed)) {
      return plainTextToRichTextDocument(toLegacyText(trimmed))
    }

    return plainTextToRichTextDocument(trimmed)
  }

  if (value && typeof value === "object") {
    const asObject = value as Record<string, unknown>
    if (Array.isArray(asObject.content)) {
      return {
        type: "doc",
        content: asObject.content,
      }
    }
  }

  return EMPTY_RICH_TEXT_DOCUMENT
}

const sanitizeRichHtml = (value: string) =>
  sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "class"],
    },
    allowedSchemes: ["http", "https", "mailto", "data"],
    transformTags: {
      a: (
        _tagName: string,
        attributes: sanitizeHtml.Attributes,
      ): sanitizeHtml.Tag => ({
        tagName: "a",
        attribs: {
          ...attributes,
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
    },
  })

export const richToHtml = (value: unknown): string => {
  if (typeof value === "string" && htmlLooksLikeMarkup(value)) {
    const sanitizedLegacy = sanitizeRichHtml(value)
    return sanitizedLegacy.trim() ? sanitizedLegacy : "<p></p>"
  }

  const rich = normalizeRichTextDocument(value)
  const html = renderRichNode(rich)
  const sanitized = sanitizeRichHtml(html)
  return sanitized.trim() ? sanitized : "<p></p>"
}

export const plainToRich = (value: string): RichTextDocument =>
  plainTextToRichTextDocument(value)

export const richToText = (value: unknown): string =>
  extractPlainTextFromRichText(normalizeRichTextDocument(value)).trim()

export const richToJsonString = (value: unknown): string =>
  toRichTextDocumentString(normalizeRichTextDocument(value))

export const readRichTextFormDraft = ({
  formData,
  richField = "description_rich",
  textField = "description",
}: {
  formData: FormData
  richField?: string
  textField?: string
}) => {
  const richRaw = String(formData.get(richField) ?? "").trim()
  const textRaw = String(formData.get(textField) ?? "").trim()
  const rich = richRaw
    ? normalizeRichTextDocument(richRaw)
    : plainTextToRichTextDocument(textRaw)
  return {
    rich,
    richRaw: richToJsonString(rich),
    text: richToText(rich),
  }
}
