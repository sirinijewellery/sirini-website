import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  blogSchema,
  generateSlug,
  ensureUniqueSlug,
  cleanSections,
  cleanLinks,
} from "@/lib/blogAdmin";

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
