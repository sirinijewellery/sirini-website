import { prisma } from "../lib/prisma";
import { matchCategorySlugs } from "../lib/taxonomy";

function words(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

(async () => {
  const all = await prisma.product.findMany({
    select: { sku: true, name: true, description: true, categories: true, material: true },
  });
  console.log("TOTAL products:", all.length);

  // category distribution
  const dist: Record<string, number> = {};
  for (const p of all) for (const c of p.categories) dist[c] = (dist[c] || 0) + 1;
  console.log("per-category:", JSON.stringify(dist));

  // earrings search simulation
  const slugs = matchCategorySlugs("earring");
  const earringMatches = all.filter(
    (p) => p.categories.some((c) => slugs.includes(c)) || /earring/i.test(p.name),
  );
  console.log(`search "earring" would match: ${earringMatches.length} (slugs=${JSON.stringify(slugs)})`);

  // description stats
  const wc = all.map((p) => words(p.description));
  const under100 = wc.filter((w) => w < 100).length;
  const in100to150 = wc.filter((w) => w >= 100 && w <= 150).length;
  const over150 = wc.filter((w) => w > 150).length;
  console.log("desc words — min/avg/max:", Math.min(...wc), Math.round(wc.reduce((a, b) => a + b, 0) / wc.length), Math.max(...wc));
  console.log(`desc length buckets — <100: ${under100} | 100-150: ${in100to150} | >150: ${over150}`);

  // duplicate descriptions
  const seen: Record<string, number> = {};
  for (const p of all) seen[p.description] = (seen[p.description] || 0) + 1;
  const dupGroups = Object.values(seen).filter((n) => n > 1);
  console.log("duplicate-description groups:", dupGroups.length, "| products sharing a dup:", dupGroups.reduce((a, b) => a + b, 0));

  // samples
  console.log("\nSAMPLES:");
  for (const p of all.slice(0, 3)) {
    console.log(`- ${p.sku} "${p.name}" [${words(p.description)}w]: ${p.description.slice(0, 160)}…`);
  }
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
