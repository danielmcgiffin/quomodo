import { describe, expect, it } from "vitest"
import {
  normalizeRichTextDocument,
  readRichTextFormDraft,
  richToHtml,
} from "./rich-text"

describe("rich-text server pipeline", () => {
  it("sanitizes malicious link payloads before render", () => {
    const html = richToHtml({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Open",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "javascript:alert(1)",
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    expect(html).toContain("Open")
    expect(html).not.toContain("javascript:")
    expect(html).not.toContain("<script")
  })

  it("supports legacy HTML payloads through compatibility normalization", () => {
    const legacyHtml =
      "<p>Legacy <strong>description</strong></p><script>alert(1)</script>"
    const normalized = normalizeRichTextDocument(legacyHtml)
    const rendered = richToHtml(legacyHtml)

    expect(normalized.type).toBe("doc")
    expect(rendered).toContain("<strong>description</strong>")
    expect(rendered).not.toContain("<script")
  })

  it("reads rich JSON drafts from form payloads", () => {
    const formData = new FormData()
    formData.set(
      "description_rich",
      JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Owner context" }],
          },
        ],
      }),
    )

    const draft = readRichTextFormDraft({ formData })

    expect(draft.text).toBe("Owner context")
    expect(draft.richRaw).toContain('"type":"doc"')
  })
})
