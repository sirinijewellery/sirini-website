import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// All fields optional so the UI can persist a lone toggle (showInMenu /
// sortOrder) without resending label + hierarchical.
const updateSchema = z.object({
  label: z.string().trim().min(1, "Label is required").optional(),
  showInMenu: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  hierarchical: z.boolean().optional(),
});

// PATCH /api/admin/taxonomy/groups/[id] — edit a dimension.
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

  const group = await prisma.taxonomyGroup.findUnique({
    where: { id },
    select: { id: true, isSystem: true },
  });
  if (!group) {
    return NextResponse.json({ error: "Dimension not found" }, { status: 404 });
  }

  const { label, showInMenu, sortOrder, hierarchical } = result.data;

  // Toggling hierarchical on a group that already has terms would orphan the
  // parent/child relationships — block it once terms exist.
  if (hierarchical !== undefined) {
    const termCount = await prisma.taxonomyTerm.count({ where: { groupId: id } });
    if (termCount > 0) {
      return NextResponse.json(
        { error: "Can't change the hierarchy of a dimension that already has terms." },
        { status: 409 }
      );
    }
  }

  const data: {
    label?: string;
    showInMenu?: boolean;
    sortOrder?: number;
    hierarchical?: boolean;
  } = {};
  if (label !== undefined) data.label = label.trim();
  if (showInMenu !== undefined) data.showInMenu = showInMenu;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;
  if (hierarchical !== undefined) data.hierarchical = hierarchical;

  const updated = await prisma.taxonomyGroup.update({ where: { id }, data });
  return NextResponse.json({ group: updated });
}

// DELETE /api/admin/taxonomy/groups/[id]?cascade=true
// System groups are never deletable. Non-system groups with terms require
// ?cascade=true (which also removes the terms and their product links).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const cascade = new URL(req.url).searchParams.get("cascade") === "true";

  const group = await prisma.taxonomyGroup.findUnique({
    where: { id },
    select: { id: true, isSystem: true, label: true },
  });
  if (!group) {
    return NextResponse.json({ error: "Dimension not found" }, { status: 404 });
  }

  if (group.isSystem) {
    return NextResponse.json(
      { error: "System dimensions can't be deleted." },
      { status: 403 }
    );
  }

  const termCount = await prisma.taxonomyTerm.count({ where: { groupId: id } });
  if (termCount > 0 && !cascade) {
    return NextResponse.json(
      {
        error: `"${group.label}" has ${termCount} term${termCount !== 1 ? "s" : ""}. Delete them first, or confirm to remove the dimension and all its terms.`,
        needsCascade: true,
      },
      { status: 409 }
    );
  }

  // Remove product links → terms → group. ProductTerm has no cascade guarantee
  // here, so clean it explicitly to avoid FK errors.
  if (termCount > 0) {
    const termIds = (
      await prisma.taxonomyTerm.findMany({
        where: { groupId: id },
        select: { id: true },
      })
    ).map((t) => t.id);
    await prisma.productTerm.deleteMany({ where: { termId: { in: termIds } } });
    await prisma.taxonomyTerm.deleteMany({ where: { groupId: id } });
  }

  await prisma.taxonomyGroup.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
