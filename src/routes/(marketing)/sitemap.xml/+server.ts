import type { RequestHandler } from "@sveltejs/kit"
import * as sitemap from "super-sitemap"
import { WebsiteBaseUrl } from "../../../config"
import { methodSections } from "$lib/marketing/method"

export const prerender = true

export const GET: RequestHandler = async () => {
  return await sitemap.response({
    origin: WebsiteBaseUrl,
    excludeRoutePatterns: [
      ".*\\(admin\\).*", // i.e. exclude routes within admin group
      "^/app.*",
      "/invite/.*", // tokenized invite links are not enumerable and should not appear in sitemap
    ],
    paramValues: {
      "/method/[slug]": methodSections.map((section) => section.slug),
    },
  })
}
