import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sectionSchema = z.object({
  heading: z.string().optional(),
  paragraphs: z.array(z.string()),
});

const relatedLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
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
  // eslint-disable-next-line no-constant-condition
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
function cleanSections(
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

function cleanLinks(links: { label: string; href: string }[]) {
  return links
    .map((l) => ({ label: l.label.trim(), href: l.href.trim() }))
    .filter((l) => l.label && l.href);
}

// GET /api/admin/blog — all posts incl. unpublished
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json(posts);
}

// POST /api/admin/blog — create
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = blogSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }

  const data = result.data;
  const baseSlug =
    data.slug && data.slug.trim() ? data.slug.trim() : generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  const publishedAt =
    data.publishedAt && !Number.isNaN(Date.parse(data.publishedAt))
      ? new Date(data.publishedAt)
      : new Date();

  const post = await prisma.blogPost.create({
    data: {
      title: data.title.trim(),
      slug,
      excerpt: data.excerpt.trim(),
      coverImage: data.coverImage.trim(),
      readMins: data.readMins,
      isPublished: data.isPublished,
      metaTitle: data.metaTitle?.trim() || null,
      metaDescription: data.metaDescription?.trim() || null,
      body: cleanSections(data.body),
      relatedLinks: cleanLinks(data.relatedLinks),
      publishedAt,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
