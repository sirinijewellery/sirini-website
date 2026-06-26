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

const createTermSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  parentId: z.string().min(1).optional().nullable(),
  label: z.string().trim().min(1, "Label is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and dashes")
    .optional()
    .or(z.literal("")),
  blurb: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  coverFocal: z.string().optional().nullable(),
  hexColor: z.string().optional().nullable(),
  showInMenu: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

// POST /api/admin/taxonomy/terms — create a term (optionally under a parent).
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

  const result = createTermSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { groupId, label, blurb, coverImage, coverFocal, hexColor, showInMenu, sortOrder } = result.data;
  const parentId = result.data.parentId ?? null;

  const group = await prisma.taxonomyGroup.findUnique({
    where: { id: groupId },
    select: { id: true, hierarchical: true },
  });
  if (!group) {
    return NextResponse.json({ error: "Dimension not found" }, { status: 404 });
  }

  // parentId is only meaningful for hierarchical groups, and the parent must
  // live in the same group and itself be a top-level term (no 3rd level).
  if (parentId) {
    if (!group.hierarchical) {
      return NextResponse.json(
        { error: "This dimension is flat — sub-terms aren't allowed." },
        { status: 422 }
      );
    }
    const parent = await prisma.taxonomyTerm.findUnique({
      where: { id: parentId },
      select: { groupId: true, parentId: true },
    });
    if (!parent || parent.groupId !== groupId) {
      return NextResponse.json(
        { error: "Parent term not found in this dimension." },
        { status: 422 }
      );
    }
    if (parent.parentId) {
      return NextResponse.json(
        { error: "Sub-terms can only nest one level deep." },
        { status: 422 }
      );
    }
  }

  const slug = result.data.slug?.trim() ? result.data.slug.trim() : slugify(label);
  if (!slug) {
    return NextResponse.json(
      { error: "Could not derive a slug from the label — please set one." },
      { status: 422 }
    );
  }

  // Slug must be unique within the group (DB enforces @@unique[groupId, slug]).
  const clash = await prisma.taxonomyTerm.findFirst({
    where: { groupId, slug },
    select: { id: true },
  });
  if (clash) {
    return NextResponse.json(
      { error: `A term with the slug "${slug}" already exists in this dimension.` },
      { status: 409 }
    );
  }

  // Append after the current max within the same parent scope.
  let order = sortOrder;
  if (order === undefined) {
    const max = await prisma.taxonomyTerm.aggregate({
      where: { groupId, parentId },
      _max: { sortOrder: true },
    });
    order = (max._max.sortOrder ?? 0) + 1;
  }

  const term = await prisma.taxonomyTerm.create({
    data: {
      groupId,
      parentId,
      label: label.trim(),
      slug,
      blurb: blurb?.trim() ? blurb.trim() : null,
      coverImage: coverImage?.trim() ? coverImage.trim() : null,
      coverFocal: coverFocal?.trim() ? coverFocal.trim() : "center",
      hexColor: hexColor?.trim() ? hexColor.trim() : null,
      showInMenu: showInMenu ?? true,
      sortOrder: order,
    },
  });

  return NextResponse.json({ term: { ...term, children: [] } }, { status: 201 });
}
