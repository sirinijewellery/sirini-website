// Generate a UNIQUE, on-brand 100-150 word description for every product, from
// its real attributes. Deterministic per-SKU (stable on re-run) and varied so
// no two products read alike.
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/generate-descriptions.ts
import { prisma } from "../lib/prisma";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Deterministic pick from a pool using sku + a salt, so each "slot" varies
// independently per product.
const pick = <T,>(sku: string, salt: string, pool: T[]): T => pool[hash(sku + salt) % pool.length];
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const CATEGORY_NOUN: Record<string, string> = {
  "necklace-sets": "necklace set",
  "long-sets": "long necklace set",
  earrings: "pair of earrings",
  bangles: "set of bangles",
  "finger-rings": "ring",
  anklets: "anklet",
};

// Detect the specific silhouette from the product name.
function silhouette(name: string, primary: string): string {
  const n = name.toLowerCase();
  if (/choker/.test(n)) return "choker";
  if (/rani\s*haar|long\s*haar|long set/.test(n)) return "rani haar";
  if (/haar/.test(n)) return "haar";
  if (/pendant/.test(n)) return "pendant set";
  if (/chandbali/.test(n)) return "chandbali earrings";
  if (/jhumk/.test(n)) return "jhumkas";
  if (/stud/.test(n)) return "studs";
  if (/kada/.test(n)) return "kada";
  if (/bracelet/.test(n)) return "bracelet";
  if (/cocktail/.test(n)) return "cocktail ring";
  if (/ghungroo|payal/.test(n)) return "ghungroo payal";
  return CATEGORY_NOUN[primary] ?? "piece";
}

// Craft sentences keyed by detected technique.
const CRAFT: Record<string, string[]> = {
  kundan: [
    "Kundan craftsmanship sets uncut, mirror-finish stones into pure gold foil for that unmistakable regal glow.",
    "Each Kundan stone is hand-set in gold foil, a centuries-old technique that gives the piece its rich, luminous depth.",
  ],
  meenakari: [
    "Hand-painted Meenakari enamel adds jewel-bright colour across the detailing, so it looks as beautiful from the back as the front.",
    "Vivid Meenakari enamelling, painted by hand, layers traditional colour over the gold-toned base.",
  ],
  polki: [
    "Unfaceted Polki stones lend an heirloom, old-world brilliance that catches the light softly.",
    "Polki work showcases natural, uncut stones for a regal, bridal richness.",
  ],
  temple: [
    "Temple-inspired motifs draw on South Indian heritage, richly carved in warm antique-gold tones.",
    "Carved temple detailing nods to classical South Indian artistry and divine motifs.",
  ],
  pearl: [
    "Lustrous pearls bring a soft, timeless elegance to the design.",
    "Delicate pearl accents add understated, classic charm.",
  ],
  antique: [
    "A lightly oxidised, antique finish gives it vintage character and depth.",
    "The antique-gold finish lends a heritage, well-worn warmth.",
  ],
  plated: [
    "It is finished in long-lasting 22kt-look gold plating over a skin-friendly base metal.",
    "A durable gold-tone plating keeps the shine bright with everyday care.",
  ],
};

const OPENERS = [
  (n: string, s: string) => `The ${n} is a handcrafted ${s} designed to feel both timeless and effortlessly wearable.`,
  (n: string, s: string) => `Meet the ${n} — a ${s} that balances traditional craft with a modern, easy-to-wear finish.`,
  (n: string, s: string) => `Crafted with care, the ${n} brings quiet luxury to every ${s.replace(/s$/, "")} detail.`,
  (n: string, s: string) => `The ${n} reimagines the classic ${s} with intricate detailing and a refined silhouette.`,
  (n: string, s: string) => `Designed in our Mumbai studio, the ${n} is a ${s} made to turn heads for all the right reasons.`,
];

const OCCASION_LINES: Record<string, string[]> = {
  bridal: [
    "It is made with brides in mind, ready to complete a wedding-day or reception look.",
    "Statement enough for the bride or the wedding party, it anchors a bridal ensemble beautifully.",
  ],
  festive: [
    "It is perfect for Diwali, Navratri, Karva Chauth and festive gatherings.",
    "Bring it out for festivals and celebrations when you want a little extra sparkle.",
  ],
  party: [
    "Ideal for sangeets, receptions and evening parties where you want to stand out.",
    "It is built for cocktail evenings and celebrations that call for a confident statement.",
  ],
  daily: [
    "Understated enough for daily and office wear, it dresses up the simplest outfit.",
    "Light and versatile, it moves easily from a workday to dinner.",
  ],
  default: [
    "It works just as well for festive celebrations as it does for a special evening out.",
    "Dress it up for an occasion or wear it to lift an everyday look.",
  ],
};

const STYLING: Record<string, string[]> = {
  "necklace-sets": [
    "Style it over a contrast blouse or a simple kurta and let the neckline take centre stage.",
    "Pair it with a sari or lehenga; the matching earrings complete the set.",
  ],
  "long-sets": [
    "Layered length makes it ideal over a lehenga or a deep-neck blouse for a regal drape.",
    "Wear it long over festive ethnic wear for instant grandeur.",
  ],
  earrings: [
    "Pair them with a sari or lehenga — the silhouette frames the face and adds movement.",
    "They sit beautifully with both ethnic and indo-western looks.",
  ],
  bangles: [
    "Stack them together or wear them solo; they slide on comfortably and catch the light with every movement.",
    "Mix them with your everyday bangles or let them shine on their own.",
  ],
  "finger-rings": [
    "An adjustable fit makes it an effortless statement on any finger.",
    "It pairs neatly with matching ethnic jewellery or stands alone as a bold accent.",
  ],
  anklets: [
    "The delicate detailing chimes softly with every step.",
    "Wear it solo or as a pair for a graceful finishing touch.",
  ],
};

const DETAIL: Record<string, string[]> = {
  "necklace-sets": [
    "It arrives as a coordinated set with matching earrings and an adjustable back closure for the perfect fit.",
    "The set pairs a statement neckpiece with matching earrings, finished with an adjustable dori fastening.",
  ],
  "long-sets": [
    "The longer drop is designed to layer gracefully and comes with matching earrings and a secure, adjustable fastening.",
    "Its extended length sits elegantly over festive wear, completed by coordinating earrings.",
  ],
  earrings: [
    "Lightweight posts and secure backs keep them comfortable from morning rituals to late-night celebrations.",
    "Smartly weighted, they add length and movement without tugging on the earlobe.",
  ],
  bangles: [
    "They come in a comfortable, true-to-size fit that slips on with ease.",
    "A smooth inner edge makes the set easy to slide on and off.",
  ],
  "finger-rings": [
    "The open, adjustable band resizes to your finger in seconds.",
    "An adjustable shank means a comfortable fit without guesswork on sizing.",
  ],
  anklets: [
    "A secure clasp and fine chain keep it sitting elegantly at the ankle.",
    "The adjustable chain settles comfortably and stays put as you move.",
  ],
};

const WEAR = [
  "Lightweight and comfortable, it is easy to wear right through a long celebration.",
  "Secure fittings and a skin-friendly finish keep it gentle, even on sensitive skin.",
  "Thoughtfully balanced, it stays comfortable without weighing you down.",
  "Smooth edges and a snug, secure fit make it a pleasure to wear all day.",
];

const CLOSERS = [
  "Each piece is handcrafted in Mumbai by Sirini Jewellery, with free shipping across India and Cash on Delivery available.",
  "Handmade in our Mumbai atelier and delivered free anywhere in India — Cash on Delivery available.",
  "Crafted by hand at Sirini Jewellery, Mumbai, and shipped free across India.",
  "Made by hand since 2015 in Mumbai, with complimentary pan-India shipping and COD.",
];

function detectTechniques(material: string, styles: string[], name: string): string[] {
  const hay = `${material} ${styles.join(" ")} ${name}`.toLowerCase();
  const out: string[] = [];
  if (/kundan/.test(hay)) out.push("kundan");
  if (/meenakari|meena/.test(hay)) out.push("meenakari");
  if (/polki/.test(hay)) out.push("polki");
  if (/temple/.test(hay)) out.push("temple");
  if (/pearl/.test(hay)) out.push("pearl");
  if (/antique|oxidi/.test(hay)) out.push("antique");
  out.push("plated"); // always mention finish
  return out.slice(0, 2); // at most 2 craft lines
}

function buildDescription(p: {
  sku: string; name: string; category: string; categories: string[];
  material: string; styles: string[]; occasions: string[];
}, variant = ""): string {
  const k = p.sku + variant; // pick key — variant lets us re-roll for uniqueness
  const name = p.name.trim();
  const primary = p.categories[0] ?? p.category;
  const sil = silhouette(name, primary);

  const opener = pick(k, "open", OPENERS)(name, CATEGORY_NOUN[primary] ?? sil);
  const techs = detectTechniques(p.material, p.styles, name);
  const craft = techs.map((t, i) => pick(k, "craft" + i, CRAFT[t]));
  const occ = (p.occasions[0] && OCCASION_LINES[p.occasions[0]]) || OCCASION_LINES.default;
  const occLine = pick(k, "occ", occ);
  const styleLine = pick(k, "style", STYLING[primary] ?? STYLING["necklace-sets"]);
  const detail = pick(k, "detail", DETAIL[primary] ?? DETAIL["necklace-sets"]);
  const wear = pick(k, "wear", WEAR);
  const closer = pick(k, "close", CLOSERS);

  // Core sentences always present.
  const body = [opener, craft[0], styleLine, detail, occLine];

  // Optional sentences appended until we reach ~115 words (and never exceed 150).
  const optionals = [
    craft[1],
    wear,
    p.occasions[1] && OCCASION_LINES[p.occasions[1]]
      ? pick(k, "occ2", OCCASION_LINES[p.occasions[1]])
      : undefined,
    pick(k, "wear2", WEAR.filter((w) => w !== wear)),
  ].filter((s): s is string => Boolean(s));

  for (const opt of optionals) {
    if (words([...body, opt, closer].join(" ")) > 150) continue;
    body.push(opt);
    if (words([...body, closer].join(" ")) >= 115) break;
  }
  return [...body, closer].join(" ");
}

(async () => {
  const all = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, category: true, categories: true, material: true, styles: true, occasions: true },
  });

  let updated = 0;
  const lengths: number[] = [];
  const seen = new Set<string>();
  for (const p of all) {
    let desc = buildDescription(p);
    // Guarantee uniqueness: re-roll the variant salt if this text already exists
    // (happens for same-named products).
    let i = 0;
    while (seen.has(desc) && i < 16) { i++; desc = buildDescription(p, "~v" + i); }
    seen.add(desc);
    lengths.push(words(desc));
    await prisma.product.update({ where: { id: p.id }, data: { description: desc } });
    updated++;
  }

  const fresh = await prisma.product.findMany({ select: { description: true } });
  const uniq = new Set(fresh.map((f) => f.description)).size;
  console.log("Updated:", updated);
  console.log("word range min/avg/max:", Math.min(...lengths), Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length), Math.max(...lengths));
  console.log("under 100:", lengths.filter((w) => w < 100).length, "| over 150:", lengths.filter((w) => w > 150).length);
  console.log("unique descriptions:", uniq, "/", all.length);
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
