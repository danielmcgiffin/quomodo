import { generateHTML, generateJSON } from "@tiptap/html"
import sanitizeHtml from "sanitize-html"
import { createRichTextExtensions } from "$lib/rich-text/extensions"
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
]

const htmlLooksLikeMarkup = (value: string) =>
  /<\/?[a-z][\s\S]*>/i.test(value)

const toLegacyText = (value: string) =>
  sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()

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
      try {
        const json = generateJSON(trimmed, createRichTextExtensions())
        if (isRichTextDocument(json)) {
          return json
        }
      } catch {
        // Fall back to plain text conversion below.
      }
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
    },
    allowedSchemes: ["http", "https", "mailto"],
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
  const rich = normalizeRichTextDocument(value)
  const html = generateHTML(rich, createRichTextExtensions())
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
