/**
 * Update Accessories subcategories in taxonomy to match Jihaan's list:
 *   Anklet, Maangtika, Hathpan, Belt, Nath, Kalira, Sheeshphool
 *
 * Changes:
 *   - Rename "kalgi" → "kalira" (label: Kalira)
 *   - Remove "finger-ring" from accessories children
 *   - Add "sheeshphool" (label: Sheeshphool)
 *
 * Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/update-accessories-terms.ts
 */
import { prisma } from "../lib/prisma";

async function main() {
  const categoryGroup = await prisma.taxonomyGroup.findUnique({
    where: { slug: "category" },
  });
  if (!categoryGroup) throw new Error("category group not found");

  // Find the "accessories" parent term
  const accessories = await prisma.taxonomyTerm.findUnique({
    where: { groupId_slug: { groupId: categoryGroup.id, slug: "accessories" } },
  });
  if (!accessories) throw new Error("accessories term not found");

  // 1. Replace kalgi with kalira
  const kalgi = await prisma.taxonomyTerm.findUnique({
    where: { groupId_slug: { groupId: categoryGroup.id, slug: "kalgi" } },
  });
  const kaliraExisting = await prisma.taxonomyTerm.findUnique({
    where: { groupId_slug: { groupId: categoryGroup.id, slug: "kalira" } },
  });

  if (kalgi && !kaliraExisting) {
    // Delete kalgi's product associations, then delete it, then create kalira
    await prisma.productTerm.deleteMany({ where: { termId: kalgi.id } });
    await prisma.taxonomyTerm.delete({ where: { id: kalgi.id } });
    await prisma.taxonomyTerm.create({
      data: {
        groupId: categoryGroup.id,
        slug: "kalira",
        label: "Kalira",
        sortOrder: kalgi.sortOrder,
        parentId: accessories.id,
      },
    });
    console.log("✓ Replaced kalgi → kalira");
  } else if (kalgi && kaliraExisting) {
    // kalira already exists, just remove kalgi
    await prisma.productTerm.deleteMany({ where: { termId: kalgi.id } });
    await prisma.taxonomyTerm.delete({ where: { id: kalgi.id } });
    // Ensure kalira is parented under accessories
    await prisma.taxonomyTerm.update({
      where: { id: kaliraExisting.id },
      data: { parentId: accessories.id, label: "Kalira" },
    });
    console.log("✓ Removed kalgi, kalira already exists (reparented under accessories)");
  } else if (kaliraExisting) {
    // Ensure it's under accessories
    await prisma.taxonomyTerm.update({
      where: { id: kaliraExisting.id },
      data: { parentId: accessories.id, label: "Kalira" },
    });
    console.log("✓ kalira already exists (ensured under accessories)");
  } else {
    const children = await prisma.taxonomyTerm.findMany({
      where: { parentId: accessories.id },
      orderBy: { sortOrder: "desc" },
    });
    const nextOrder = (children[0]?.sortOrder ?? -1) + 1;
    await prisma.taxonomyTerm.create({
      data: {
        groupId: categoryGroup.id,
        slug: "kalira",
        label: "Kalira",
        sortOrder: nextOrder,
        parentId: accessories.id,
      },
    });
    console.log("✓ Created kalira under accessories");
  }

  // 2. Remove finger-ring from accessories (delete the term)
  const fingerRing = await prisma.taxonomyTerm.findUnique({
    where: { groupId_slug: { groupId: categoryGroup.id, slug: "finger-ring" } },
  });
  if (fingerRing) {
    // Remove any ProductTerm associations first
    await prisma.productTerm.deleteMany({ where: { termId: fingerRing.id } });
    await prisma.taxonomyTerm.delete({ where: { id: fingerRing.id } });
    console.log("✓ Removed finger-ring from accessories");
  } else {
    console.log("⚠ finger-ring not found (already removed?)");
  }

  // 3. Add sheeshphool
  const existing = await prisma.taxonomyTerm.findUnique({
    where: { groupId_slug: { groupId: categoryGroup.id, slug: "sheeshphool" } },
  });
  if (existing) {
    console.log("⚠ sheeshphool already exists");
  } else {
    const children = await prisma.taxonomyTerm.findMany({
      where: { parentId: accessories.id },
      orderBy: { sortOrder: "desc" },
    });
    const nextOrder = (children[0]?.sortOrder ?? -1) + 1;
    await prisma.taxonomyTerm.create({
      data: {
        groupId: categoryGroup.id,
        slug: "sheeshphool",
        label: "Sheeshphool",
        sortOrder: nextOrder,
        parentId: accessories.id,
      },
    });
    console.log("✓ Added sheeshphool under accessories");
  }

  // 4. Reorder to match Jihaan's exact order
  const desiredOrder = ["anklet", "maangtika", "hathpan", "belt", "nath", "kalira", "sheeshphool"];
  for (let i = 0; i < desiredOrder.length; i++) {
    await prisma.taxonomyTerm.updateMany({
      where: {
        groupId: categoryGroup.id,
        slug: desiredOrder[i],
        parentId: accessories.id,
      },
      data: { sortOrder: i },
    });
  }
  console.log("✓ Reordered accessories subcategories");

  // Verify
  const finalChildren = await prisma.taxonomyTerm.findMany({
    where: { parentId: accessories.id },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, label: true, sortOrder: true },
  });
  console.log("\nFinal accessories subcategories:");
  for (const c of finalChildren) {
    console.log(`  ${c.sortOrder}. ${c.label} (${c.slug})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
