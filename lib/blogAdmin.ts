import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Shared validation + slug helpers for the admin blog API routes.
// Lives in lib/ because Next.js route modules must export only HTTP handlers.

const sectionSchema = z.object({
  heading: z.string().optional(),
  paragraphs: z.array(z.string()),
});

const relatedLinkSchema = z.object({
  label: z.string().min(1),
  // Internal path or http(s) URL only — nothing that could smuggle a
  // javascript: href into the public blog's "Shop the Story" links.
  href: z
    .string()
    .trim()
    .min(1)
    .regex(/^(\/|https?:\/\/)/, "Link must start with / or http(s)://"),
});

export const blogSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers and dashes")
    .optional(),
  excerpt: z.string().trim().min(1, "Excerpt is required"),
  coverImage: z.string().trim().min(1, "Cover image is required"),
  readMins: z.number().int().min(1).max(120),
  isPublished: z.boolean(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  body: z.array(sectionSchema),
  relatedLinks: z.array(relatedLinkSchema),
  // Optional explicit publish date (ISO). Defaults to now on create.
  publishedAt: z.string().optional().nullable(),
});

export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Ensure a slug is unique, optionally excluding a given post id. */
export async function ensureUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = base || "post";
  let n = 1;
  // Loop until we find a slug not taken by another post.
  while (true) {
    const existing = await prisma.blogPost.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

// Normalise sections — drop empty paragraphs and fully empty sections.
export function cleanSections(
  sections: { heading?: string; paragraphs: string[] }[],
) {
  return sections
    .map((s) => ({
      heading: s.heading?.trim() ? s.heading.trim() : undefined,
      paragraphs: s.paragraphs.map((p) => p.trim()).filter(Boolean),
    }))
    .filter((s) => s.heading || s.paragraphs.length > 0)
    .map((s) => (s.heading ? { heading: s.heading, paragraphs: s.paragraphs } : { paragraphs: s.paragraphs }));
}

export function cleanLinks(links: { label: string; href: string }[]) {
  return links
    .map((l) => ({ label: l.label.trim(), href: l.href.trim() }))
    .filter((l) => l.label && l.href);
}
