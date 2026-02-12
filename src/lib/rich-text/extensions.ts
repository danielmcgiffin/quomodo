import Link from "@tiptap/extension-link"
import StarterKit from "@tiptap/starter-kit"
import type { Extensions } from "@tiptap/core"

export const createRichTextExtensions = (): Extensions => [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
    horizontalRule: false,
    link: false,
  }),
  Link.configure({
    autolink: true,
    openOnClick: false,
    defaultProtocol: "https",
    protocols: ["http", "https", "mailto"],
    HTMLAttributes: {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    },
  }),
]
