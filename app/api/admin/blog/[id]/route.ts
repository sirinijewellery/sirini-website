import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  blogSchema,
  generateSlug,
  ensureUniqueSlug,
} from "../route";

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

// PUT /api/admin/blog/:id — update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

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

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const data = result.data;
  const baseSlug =
    data.slug && data.slug.trim() ? data.slug.trim() : generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug, id);

  const publishedAt =
    data.publishedAt && !Number.isNaN(Date.parse(data.publishedAt))
      ? new Date(data.publishedAt)
      : undefined;

  const post = await prisma.blogPost.update({
    where: { id },
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
      ...(publishedAt ? { publishedAt } : {}),
    },
  });

  return NextResponse.json(post);
}

// DELETE /api/admin/blog/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await prisma.blogPost.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
