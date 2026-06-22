/**
 * Seed the admin-managed taxonomy: groups (Shop by ___ dimensions) + terms.
 * Idempotent — upserts by slug, safe to re-run. Adds nothing to products
 * (owner tags products themselves).
 *
 * Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/seed-taxonomy.ts
 */
import { prisma } from "../lib/prisma";

type TermSeed = { slug: string; label: string; children?: TermSeed[] };
type GroupSeed = {
  slug: string;
  label: string;
  hierarchical?: boolean;
  sortOrder: number;
  terms: TermSeed[];
};

const GROUPS: GroupSeed[] = [
  {
    slug: "category",
    label: "Shop by Category",
    hierarchical: true,
    sortOrder: 0,
    terms: [
      {
        slug: "necklace-set",
        label: "Necklace Set",
        children: [
          { slug: "short-necklaces", label: "Short Necklaces" },
          { slug: "chokers", label: "Chokers" },
          { slug: "pendant-set", label: "Pendant Set" },
          { slug: "long-set", label: "Long Set" },
          { slug: "mangalsutra", label: "Mangalsutra" },
          { slug: "groom-mala", label: "Groom Mala" },
        ],
      },
      {
        slug: "earrings",
        label: "Earrings",
        children: [
          { slug: "jhumkis", label: "Jhumkis" },
          { slug: "studs", label: "Studs" },
          { slug: "danglers", label: "Danglers" },
          { slug: "chandbalis", label: "Chandbalis" },
        ],
      },
      {
        slug: "bangles",
        label: "Bangles",
        children: [
          { slug: "kada", label: "Kada" },
          { slug: "bracelets", label: "Bracelets" },
          { slug: "pair-bangle", label: "Pair Bangle" },
          { slug: "jota", label: "Jota" },
        ],
      },
      {
        slug: "accessories",
        label: "Accessories",
        children: [
          { slug: "anklet", label: "Anklet" },
          { slug: "maangtika", label: "Maangtika" },
          { slug: "hathpan", label: "Hathpan" },
          { slug: "belt", label: "Belt" },
          { slug: "nath", label: "Nath" },
          { slug: "kalgi", label: "Kalgi" },
          { slug: "finger-ring", label: "Finger Ring" },
        ],
      },
    ],
  },
  {
    slug: "occasion",
    label: "Shop by Occasion",
    sortOrder: 1,
    terms: [
      { slug: "bridal", label: "Bridal & Wedding" },
      { slug: "festive", label: "Festive Edit" },
      { slug: "party", label: "Party & Cocktail" },
      { slug: "daily", label: "Daily Wear" },
    ],
  },
  {
    slug: "collection",
    label: "Shop by Collection",
    sortOrder: 2,
    terms: [
      { slug: "heritage", label: "Heritage" },
      { slug: "kundan", label: "Kundan" },
      { slug: "antique-gold", label: "Antique Gold" },
      { slug: "temple", label: "Temple" },
      { slug: "victorian", label: "Victorian" },
      { slug: "demi-fine", label: "Demi-Fine" },
    ],
  },
  {
    slug: "look",
    label: "Shop by Look",
    sortOrder: 3,
    terms: [
      { slug: "western", label: "Western" },
      { slug: "traditional", label: "Traditional" },
      { slug: "indo-western", label: "Indo-Western" },
      { slug: "daily-wear", label: "Daily Wear" },
    ],
  },
  {
    slug: "stone",
    label: "Shop by Stone",
    sortOrder: 4,
    terms: [
      { slug: "polki-kundan", label: "Polki Kundan" },
      { slug: "ruby", label: "Ruby" },
      { slug: "emerald", label: "Emerald" },
      { slug: "kemp", label: "Kemp" },
    ],
  },
  {
    slug: "colour",
    label: "Shop by Colour",
    sortOrder: 5,
    terms: [
      { slug: "white", label: "White" },
      { slug: "ruby", label: "Ruby" },
      { slug: "mint", label: "Mint" },
      { slug: "pink", label: "Pink" },
      { slug: "mint-pink", label: "Mint + Pink" },
      { slug: "green", label: "Green" },
      { slug: "others", label: "Others" },
    ],
  },
];

async function upsertTerm(
  groupId: string,
  t: TermSeed,
  order: number,
  parentId: string | null
): Promise<void> {
  const existing = await prisma.taxonomyTerm.findUnique({
    where: { groupId_slug: { groupId, slug: t.slug } },
  });
  const term = existing
    ? await prisma.taxonomyTerm.update({
        where: { id: existing.id },
        data: { label: t.label, sortOrder: order, parentId },
      })
    : await prisma.taxonomyTerm.create({
        data: { groupId, slug: t.slug, label: t.label, sortOrder: order, parentId },
      });

  if (t.children?.length) {
    let i = 0;
    for (const child of t.children) {
      await upsertTerm(groupId, child, i++, term.id);
    }
  }
}

async function main() {
  for (const g of GROUPS) {
    const group = await prisma.taxonomyGroup.upsert({
      where: { slug: g.slug },
      create: {
        slug: g.slug,
        label: g.label,
        hierarchical: g.hierarchical ?? false,
        sortOrder: g.sortOrder,
        isSystem: true,
      },
      update: { label: g.label, hierarchical: g.hierarchical ?? false, sortOrder: g.sortOrder, isSystem: true },
    });
    let i = 0;
    for (const t of g.terms) {
      await upsertTerm(group.id, t, i++, null);
    }
    const count = await prisma.taxonomyTerm.count({ where: { groupId: group.id } });
    console.log(`  ${g.slug.padEnd(12)} -> ${count} terms`);
  }

  const groups = await prisma.taxonomyGroup.count();
  const terms = await prisma.taxonomyTerm.count();
  console.log(`Done. ${groups} groups, ${terms} terms total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
