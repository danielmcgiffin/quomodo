import { error } from "@sveltejs/kit";
import { methodContent } from "$lib/method-content";
import { methodSections } from "$lib/method";

export const entries = () => methodContent.map((section) => ({ slug: section.slug }));

export const load = ({ params }) => {
  const idx = methodContent.findIndex((section) => section.slug === params.slug);
  if (idx === -1) {
    throw error(404, "Not found");
  }

  return {
    section: methodContent[idx],
    idx,
    prev: idx > 0 ? methodSections[idx - 1] : null,
    next: idx < methodSections.length - 1 ? methodSections[idx + 1] : null,
    total: methodSections.length
  };
};
