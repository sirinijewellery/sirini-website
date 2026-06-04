/**
 * Give every product a unique, evocative boutique-style name.
 *   <Muse name> + <style noun that keeps a traditional keyword>
 *   e.g. "Noor Kundan Choker", "Sitara Chandbali Earrings"
 *
 * - Muse names are unique per product (pool > 129) so full names never collide.
 * - Style nouns rotate within each category for variety + keep SEO keywords.
 * - Slug = slugify(name) + "-" + sku  (guaranteed unique via sku).
 * - Occasions are stored separately, so renaming does NOT affect occasion tags.
 *
 * Re-runnable.
 */
import { prisma } from '../lib/prisma';

// 135 evocative muse names (poetic Hindi/Urdu words + names) — all unique.
const MUSE = [
  'Noor', 'Aabha', 'Aaina', 'Aalia', 'Aaravi', 'Aarna', 'Aashna', 'Aditi', 'Ahaana', 'Aira',
  'Aisha', 'Alaya', 'Aleena', 'Amara', 'Ambar', 'Amaira', 'Anaya', 'Anika', 'Anvi', 'Aradhya',
  'Avani', 'Bahaar', 'Banita', 'Chandni', 'Charvi', 'Damini', 'Darshana', 'Diya', 'Eira', 'Elaina',
  'Falak', 'Gauri', 'Gulnaaz', 'Gulzar', 'Hiya', 'Husna', 'Ila', 'Inaaya', 'Indira', 'Ira',
  'Ishani', 'Jahnavi', 'Jasmin', 'Jiya', 'Kainaat', 'Kalindi', 'Kashish', 'Kavya', 'Keya', 'Kiara',
  'Kimaya', 'Kyra', 'Lavanya', 'Mahira', 'Maira', 'Malhaar', 'Manvi', 'Meher', 'Mehek', 'Mishka',
  'Mohini', 'Myra', 'Naina', 'Naira', 'Navya', 'Nehmat', 'Nidhi', 'Noorani', 'Nyra', 'Oorja',
  'Pari', 'Prisha', 'Raabia', 'Raahi', 'Raina', 'Rasha', 'Reet', 'Rida', 'Rihana', 'Riya',
  'Roshni', 'Rukhsar', 'Rumi', 'Saanjh', 'Saanvi', 'Sahar', 'Saira', 'Samaira', 'Sanaya', 'Sara',
  'Sayuri', 'Shanaya', 'Sharvani', 'Shireen', 'Sitara', 'Suhana', 'Tanvi', 'Tara', 'Trisha', 'Urvi',
  'Vaani', 'Vanya', 'Vedika', 'Yamini', 'Zaina', 'Zara', 'Zoya', 'Aanya', 'Bhavya', 'Chhavi',
  'Devika', 'Eshani', 'Gunjan', 'Hansika', 'Ishita', 'Jhanvi', 'Larisa', 'Mira', 'Niharika', 'Ojaswini',
  'Palak', 'Reva', 'Saumya', 'Tejal', 'Vrinda', 'Yashvi', 'Zeenat', 'Bela', 'Chitra', 'Esha',
  'Inaya', 'Kiona', 'Mehr', 'Zuni', 'Vihana',
];

// Style nouns per category — keep traditional keywords for SEO.
const STYLE: Record<string, string[]> = {
  'necklace-sets': [
    'Kundan Choker', 'Polki Necklace Set', 'Meenakari Haar', 'Temple Necklace Set',
    'Bridal Choker', 'Rani Haar', 'Jadau Set', 'Pearl Necklace Set',
    'Layered Haar', 'Kundan Bridal Set', 'Antique Necklace Set', 'Choker Set',
  ],
  'earrings': [
    'Kundan Jhumkas', 'Chandbali Earrings', 'Meenakari Jhumkis', 'Temple Jhumkas',
    'Polki Studs', 'Pearl Drops', 'Jadau Earrings', 'Chandelier Earrings',
  ],
  'bangles': [
    'Kundan Bangles', 'Meenakari Bangles', 'Antique Kada', 'Bridal Choodiyan',
    'Pearl Bangles', 'Polki Kada',
  ],
  'finger-rings': [
    'Kundan Ring', 'Meenakari Ring', 'Polki Cocktail Ring', 'Statement Ring',
    'Adjustable Ring', 'Jadau Ring',
  ],
  'anklets': [
    'Ghungroo Payal', 'Silver Anklet', 'Kundan Payal', 'Bridal Anklet',
    'Layered Payal', 'Beaded Anklet',
  ],
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, category: true, sku: true },
    orderBy: { createdAt: 'asc' },
  });

  if (products.length > MUSE.length) {
    throw new Error(`Not enough muse names (${MUSE.length}) for ${products.length} products.`);
  }

  // per-category rotation index for style nouns
  const catIdx: Record<string, number> = {};
  const usedSlugs = new Set<string>();
  const samples: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const muse = MUSE[i];
    const stylePool = STYLE[p.category] ?? STYLE['necklace-sets'];
    const idx = catIdx[p.category] ?? 0;
    catIdx[p.category] = idx + 1;
    const style = stylePool[idx % stylePool.length];

    const name = `${muse} ${style}`;
    let slug = `${slugify(name)}-${p.sku.toLowerCase()}`;
    // safety: ensure unique slug
    while (usedSlugs.has(slug)) slug = `${slug}-x`;
    usedSlugs.add(slug);

    await prisma.product.update({ where: { id: p.id }, data: { name, slug } });
    if (samples.length < 12) samples.push(`${name}  (${p.category})`);
  }

  console.log(`Renamed ${products.length} products with unique creative names.`);
  console.log('\nSamples:');
  samples.forEach((s) => console.log('  ' + s));

  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
