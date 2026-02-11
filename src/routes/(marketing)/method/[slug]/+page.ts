import { error } from "@sveltejs/kit"
import { methodBySlug, methodSections } from "$lib/marketing/method"

export const prerender = true

export const entries = () => methodSections.map((section) => ({ slug: section.slug }))

export const load = ({ params }) => {
  const section = methodBySlug.get(params.slug)
  if (!section) {
    throw error(404, "Method section not found")
  }

  const index = methodSections.findIndex((entry) => entry.slug === section.slug)

  return {
    section,
    index,
    total: methodSections.length,
    previous: index > 0 ? methodSections[index - 1] : null,
    next: index < methodSections.length - 1 ? methodSections[index + 1] : null,
  }
}
