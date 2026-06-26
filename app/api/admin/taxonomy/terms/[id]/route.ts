import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// All optional so a lone toggle/reorder doesn't clobber other fields.
const updateSchema = z.object({
  label: z.string().trim().min(1, "Label is required").optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and dashes")
    .optional(),
  blurb: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  coverFocal: z.string().optional().nullable(),
  hexColor: z.string().optional().nullable(),
  showInMenu: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

// PATCH /api/admin/taxonomy/terms/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const term = await prisma.taxonomyTerm.findUnique({
    where: { id },
    select: { id: true, groupId: true },
  });
  if (!term) {
    return NextResponse.json({ error: "Term not found" }, { status: 404 });
  }

  const { label, blurb, coverImage, coverFocal, hexColor, showInMenu, sortOrder } = result.data;

  // If the slug changes, keep it unique within the group.
  if (result.data.slug !== undefined) {
    const slug = result.data.slug.trim();
    const clash = await prisma.taxonomyTerm.findFirst({
      where: { groupId: term.groupId, slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: `A term with the slug "${slug}" already exists in this dimension.` },
        { status: 409 }
      );
    }
  }

  const data: {
    label?: string;
    slug?: string;
    blurb?: string | null;
    coverImage?: string | null;
    coverFocal?: string | null;
    hexColor?: string | null;
    showInMenu?: boolean;
    sortOrder?: number;
  } = {};
  if (label !== undefined) data.label = label.trim();
  if (result.data.slug !== undefined) {
    // Fall back to a label-derived slug if the field was cleared.
    data.slug = result.data.slug.trim() || (label ? slugify(label) : undefined);
    if (!data.slug) {
      return NextResponse.json({ error: "Slug can't be empty." }, { status: 422 });
    }
  }
  if (blurb !== undefined) data.blurb = blurb?.trim() ? blurb.trim() : null;
  if (coverImage !== undefined) {
    data.coverImage = coverImage?.trim() ? coverImage.trim() : null;
  }
  if (coverFocal !== undefined) {
    data.coverFocal = coverFocal?.trim() ? coverFocal.trim() : "center";
  }
  if (hexColor !== undefined) {
    data.hexColor = hexColor?.trim() ? hexColor.trim() : null;
  }
  if (showInMenu !== undefined) data.showInMenu = showInMenu;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const updated = await prisma.taxonomyTerm.update({ where: { id }, data });
  return NextResponse.json({ term: updated });
}

// DELETE /api/admin/taxonomy/terms/[id]
// Removes the term, its product links, and (for a hierarchical parent) all of
// its sub-terms and their links.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const term = await prisma.taxonomyTerm.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!term) {
    return NextResponse.json({ error: "Term not found" }, { status: 404 });
  }

  // Collect this term plus any direct children (taxonomy nests one level deep).
  const children = await prisma.taxonomyTerm.findMany({
    where: { parentId: id },
    select: { id: true },
  });
  const ids = [id, ...children.map((c) => c.id)];

  await prisma.productTerm.deleteMany({ where: { termId: { in: ids } } });
  await prisma.taxonomyTerm.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ success: true, deleted: ids.length });
}
