export type MethodSection = {
  slug: string;
  title: string;
  summary: string;
};

import { methodContent } from "$lib/method-content";

export const methodSections: MethodSection[] = methodContent.map((section) => ({
  slug: section.slug,
  title: section.title,
  summary: section.summary
}));

export const methodPath = (slug: string) => `/method/${slug}`;
