import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getTaxonomyTree } from "@/lib/queries/taxonomy";

// Slug from a free-text label: lowercase, hyphenated, trimmed of edge dashes.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const createGroupSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and dashes")
    .optional()
    .or(z.literal("")),
  hierarchical: z.boolean().optional(),
  showInMenu: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

// GET /api/admin/taxonomy — full tree (all groups + nested terms).
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const groups = await getTaxonomyTree();
  return NextResponse.json({ groups });
}

// POST /api/admin/taxonomy — create a new dimension (group).
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

  const result = createGroupSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { label, hierarchical, showInMenu, sortOrder } = result.data;
  const slug = result.data.slug?.trim() ? result.data.slug.trim() : slugify(label);
  if (!slug) {
    return NextResponse.json(
      { error: "Could not derive a slug from the label — please set one." },
      { status: 422 }
    );
  }

  const existing = await prisma.taxonomyGroup.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: `A dimension with the slug "${slug}" already exists.` },
      { status: 409 }
    );
  }

  // Append new dimensions after the current max so they don't reorder others.
  let order = sortOrder;
  if (order === undefined) {
    const max = await prisma.taxonomyGroup.aggregate({ _max: { sortOrder: true } });
    order = (max._max.sortOrder ?? 0) + 1;
  }

  const group = await prisma.taxonomyGroup.create({
    data: {
      label: label.trim(),
      slug,
      hierarchical: hierarchical ?? false,
      showInMenu: showInMenu ?? true,
      sortOrder: order,
      isSystem: false,
    },
  });

  return NextResponse.json(
    { group: { ...group, terms: [] } },
    { status: 201 }
  );
}
