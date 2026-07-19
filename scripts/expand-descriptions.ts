/**
 * expand-descriptions.ts
 * Rewrites the `description` field for all 129 real products across 5 categories
 * into rich, SEO-friendly 150-200 word descriptions using 5 distinct templates
 * per category (rotated by product index).
 *
 * Run: npx tsx --env-file=.env.local scripts/expand-descriptions.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const REAL_CATEGORIES = [
  "anklets",
  "bangles",
  "earrings",
  "finger-rings",
  "necklace-sets",
];

const TEMPLATES: Record<string, string[]> = {
  "necklace-sets": [
    `Revel in the grandeur of traditional Indian jewellery with this exquisite Kundan necklace set, painstakingly handcrafted by skilled artisans. The choker-style neckpiece is adorned with meticulously set Kundan stones on a polished 18–22K gold-plated brass base, creating a tapestry of warm amber and ivory tones that mirror heirloom bridal jewellery. Matching drop earrings complete the set, each carrying the same rich stonework for a perfectly coordinated look. The Meenakari enamel detailing on the reverse of the pendant adds a layer of artistry that connoisseurs appreciate. Designed expressly for weddings and grand receptions, this set transforms a bridal lehenga or heavy silk saree into an unforgettable ensemble. Equally breathtaking at sangeet ceremonies and engagement celebrations, it elevates every photograph into a timeless memory. The gold-plated finish is carefully sealed to resist tarnish, ensuring the set retains its lustrous brilliance for years with minimal care. Each piece undergoes rigorous quality checks before dispatch.`,

    `Step into a world of regal elegance with this temple-style necklace set that draws its design language from the jewellery traditions of South India. Layered tiers of intricate gold-plated motifs cascade gracefully from the neckline, each element individually cast and polished before being strung together by hand. Goddess-inspired coin pendants alternate with delicate coral beads, giving the set a devotional aesthetic that feels equally at home in a Bharatanatyam performance or a traditional South Indian wedding. The matching chandelier earrings sway with captivating movement, framing the face beautifully. Crafted on a 18–22K gold-plated copper base, the set carries a satisfying weight that speaks of quality without being burdensome to wear. Brides seeking a heritage-inspired alternative to heavy Kundan jewellery will find this set a treasure. It pairs effortlessly with Kanjivaram silks, bridal velvets and contemporary fusion lehengas. Each piece undergoes rigorous quality checks before dispatch.`,

    `This opulent Meenakari necklace set is a celebration of colour and craft, bringing the vibrant enamel-painting traditions of Rajasthan into a wearable work of art. The broad collar necklace is hand-painted in jewel-toned enamel — deep ruby, peacock teal and ivory — against a gleaming 18–22K gold-plated surface, each pigment fired and sealed for lasting vibrancy. Kundan polki stones are set at key focal points, adding a brilliant sparkle that contrasts beautifully with the matt enamel. The set arrives with coordinating jhumki earrings whose bell silhouettes carry the same vivid palette. Perfect for festive occasions, it is a natural choice for Navratri, Diwali, Teej and sangeet celebrations where colour-rich dressing is encouraged and admired. Wedding guests and bridesmaids love it as a statement piece that photographs strikingly. The gold-plated finish is hardened with a protective lacquer coat to preserve both colour and shine. Each piece undergoes rigorous quality checks before dispatch.`,

    `Understated yet unmistakably luxurious, this pearl-and-Kundan necklace set speaks the language of quiet grandeur. Rows of lustrous off-white shell pearls are interspersed with hand-set Kundan florets on a 18–22K gold-plated setting, creating a rhythm of shimmer and softness that suits both day and evening festivities. The matching earrings mirror the layered pearl-and-stone motif, keeping the overall look cohesive and polished. Designed for the modern bride who values refinement over ostentation, this set works beautifully with pastel lehengas, cream and ivory sarees, and blush-toned anarkalis. It is equally appropriate for pre-wedding functions, engagement ceremonies and intimate reception dinners. The set sits comfortably close to the neckline without feeling heavy, making it ideal for events where you will be greeting guests and dancing for hours. Minimal care — a soft wipe after wear — keeps it pristine. Each piece undergoes rigorous quality checks before dispatch.`,

    `Bold, layered and unapologetically festive — this Kundan choker with long pendant necklace set is built for women who wear jewellery as armour and art. The chunky choker layer features geometric Kundan clusters on a gold-plated base, while a long pendant chain with a central statement drop adds vertical drama and draws the eye down beautifully. The set is completed by a pair of large stud earrings with matching stonework so you can wear all three pieces together or mix and match. Rose-gold toning on the pendant bail adds a contemporary accent that bridges traditional and modern sensibilities. Whether you are the bride, the maid of honour or the most stylish guest at the baraat, this set ensures you will be remembered. It is crafted for weddings, grand receptions and high-glamour festive nights where ordinary jewellery simply will not do. Each piece undergoes rigorous quality checks before dispatch.`,
  ],

  earrings: [
    `These handcrafted gold-plated jhumka earrings are a quintessential expression of traditional Indian jewellery design. The dome-shaped upper section is encrusted with Kundan-style stones in warm amber and ivory hues, while the bell-shaped lower half is engraved with delicate floral motifs that catch the light from every angle. Tiny ghungroo (bell) drops dangle from the rim, adding a soft melodic sway to each movement. Set on a 18–22K gold-plated brass base, they carry a rich warmth without the weight of solid metal. Feather-light and comfortable, they are designed for all-day and all-night wear — from morning mehendi ceremonies to post-midnight dance floors. Their versatility is remarkable: pair them with a silk saree for a wedding, a cotton kurta for a festive gathering or a boho fusion outfit for a contemporary event. Hypoallergenic hooks ensure comfort for sensitive ears throughout extended wear. Each piece undergoes rigorous quality checks before dispatch.`,

    `Chandelier earrings have defined Indian bridal style for centuries, and this pair brings that legacy into sharp contemporary focus. Three cascading tiers of intricate gold-plated filigree are studded with hand-set Meenakari enamel drops in peacock green and ruby red, catching light like tiny prisms with every movement. The top stud features a large Kundan cluster for a statement entrance into the ear, and the overall earring length is calibrated to brush — but not touch — the shoulder, creating an elegant silhouette. Crafted on a 18–22K gold-plated base, the construction is sturdy enough to hold its shape across long celebration days. These earrings are particularly prized by bridesmaids looking for a piece that complements — without competing with — the bride's heavier set. They also work beautifully as standalone statement pieces for festive evenings with minimal other jewellery. Each piece undergoes rigorous quality checks before dispatch.`,

    `These oversized oxidised silver-finish earrings are a love letter to tribal and folk jewellery traditions from across India. Heavy geometric pendants stamped with floral and paisley motifs hang from an ear post, balanced by a secure back for all-day comfort. The dark oxidised finish is deliberately aged to highlight the raised design work, creating a striking contrast of light metal against deep shadow. Small beads and stone drops add colour and movement without overwhelming the primary design. Though bold in scale, they are surprisingly lightweight — crafted from a high-grade alloy that achieves visual drama without physical discomfort. They pair magnificently with mirror-work chaniya cholis, bandhani sarees and block-print cotton kurtas for festive casual occasions. For the jewellery lover who prefers ethnic over bridal, these are an everyday treasure as well as a festive statement. Each piece undergoes rigorous quality checks before dispatch.`,

    `Stud earrings often underplay their potential, but these Kundan and pearl cluster studs prove the format can be as lavish as any chandelier. A central dome of hand-set Kundan polki stones surrounded by a ring of micro shell pearls creates a motif that reads as both classic and fresh. The 18–22K gold-plated setting is deep and substantial, giving the studs a three-dimensional sculptural quality you will see even across a crowded room. Secure screw-back fittings keep them firmly in place during fast dances and long ceremonies. These studs are a wonderful choice for daytime weddings, outdoor festivals and occasions where longer earrings feel impractical — they frame the face without swinging or tangling in hair or dupatta. They are also ideal for daily wear during festive seasons, adding a touch of celebration to work attire or casual ethnic dressing. Each piece undergoes rigorous quality checks before dispatch.`,

    `These rose-gold-plated tassel earrings are for the modern Indian woman who draws equal inspiration from tradition and contemporary style. The ear top is a small floral stud finished in blush rose-gold toning, from which a generous fan of fine metal chains cascades, each strand tipped with a tiny seed bead. The movement of the tassel is hypnotic — every step and gesture sends ripples of light through the chains. Crafted on a brass base with a rose-gold electroplating that resists tarnish, they maintain their warm glow across an entire wedding season. Light as a feather, they can be worn from a morning puja to a midnight after-party without fatigue. They suit Indo-western fusion looks exceptionally well, pairing with crop-top lehengas, dhoti pants and contemporary kurtas. Their understated elegance makes them a versatile addition to any jewellery collection. Each piece undergoes rigorous quality checks before dispatch.`,
  ],

  bangles: [
    `This set of handcrafted gold-plated bangles is the quintessential Indian wrist stack — rich in colour, texture and tradition. Each bangle is individually cast from a high-grade brass base and coated in a lustrous 18–22K gold-plated finish that glows like solid gold. Intricate Kundan-style stones are set flush along the outer surface in a repeating floral motif, creating a continuous shimmer that catches the eye from across the room. The inner circumference is polished smooth for comfortable prolonged wear, while the outer face is deliberately sculpted with relief work for visual depth. Available in standard Indian bangle sizes, this set is ideal for creating the full-wrist choora effect beloved at weddings and engagement ceremonies. Layer them with plain gold-toned bangles to create your own personalised stack, or wear them as a standalone set for festive days and family gatherings. Each piece undergoes rigorous quality checks before dispatch.`,

    `Celebrate the art of Meenakari with these stunning enamel-painted gold-plated bangles, where each wrist piece becomes a tiny canvas for traditional Indian craft. Deep jewel-toned enamel in peacock blue, emerald and poppy red is hand-applied over a precision-engraved gold-plated brass base, then fired and sealed for enduring vibrancy. The effect is extraordinary — at first glance they appear to be expensive antique pieces from a royal treasury. Wear them individually as a bold single-piece statement, or stack multiple bangles to create a riot of colour that elevates a plain chikankari kurta or a simple silk saree to ceremonial heights. Their medium width fits most wrists without slipping, while the smooth inner profile ensures all-day comfort. Perfect for Navratri, Diwali, Teej, sangeet functions and every festival that calls for your most joyful self. Each piece undergoes rigorous quality checks before dispatch.`,

    `These thin gold-plated stackable bangles are designed for the woman who loves to build her own wrist story. Each bangle is a slender band of polished 18–22K gold-plated brass accented by a single line of micro Kundan stones or engraved geometric detailing — subtle individually, magnificent when massed. The design philosophy is intentional: buy a set, mix with your existing gold or silver bangles, and create a stack that is entirely your own. Lightweight and barely-there in feel, they can be worn through a full working day without the clinking distraction of heavier bangles. They slide on and off easily, making them practical for busy women who love ethnic accessories without the fuss. For festive occasions and weddings, pile on as many as you like — the more, the merrier. A perfect gifting option for birthdays, Diwali hampers and bridesmaids. Each piece undergoes rigorous quality checks before dispatch.`,

    `Broad and architectural, these oxidised gold-finish bangles are statement pieces that command attention with their bold silhouette and intricate surface work. The wide cuff-style profile features embossed temple motifs — elephants, lotuses and peacocks — rendered in sharp relief against the darkened oxidised background. Scattered mirror inserts and seed bead borders add sparkle and texture to the heritage design vocabulary. The oxidised finish is stabilised to prevent further darkening and gives these bangles a vintage antique quality that pairs beautifully with both traditional and boho-ethnic outfits. Wear one bangle for quiet daytime elegance or stack both for a dramatic festive impact. They fit most wrists with a slight spring-fit design that makes them easy to wear and remove without compromise to the structure. Ideal for Navratri garba dances, ethnic fusion events, bridal photoshoots and cultural festivals. Each piece undergoes rigorous quality checks before dispatch.`,

    `There is something deeply auspicious about glass-and-gold bangle sets in Indian culture, and this contemporary interpretation honours that tradition while updating it for modern tastes. A set of smooth glass bangles in rich jewel tones — deep burgundy, royal blue and forest green — is paired with gold-plated metal spacer bangles engraved with fine floral patterns, creating a beautiful interplay of colour and metallic shine. The colour palette has been chosen to complement both warm and cool skin tones, making them universally flattering. Wear the complete mixed set for weddings and sangeet nights, or separate the glass and metal bangles to create two distinct stacks for different occasions. The glass bangles are of thicker, sturdier construction that resists casual breakage, while the metal bangles are built to last across seasons of festive wear. An ideal bridal gift or bridesmaid favour. Each piece undergoes rigorous quality checks before dispatch.`,
  ],

  "finger-rings": [
    `This cocktail finger ring is designed to be the centrepiece of any jewellery look — large, luminous and impossible to ignore. The oversized dome setting is encrusted with a mosaic of Kundan polki stones in warm ivory and gold tones, mounted on a broad 18–22K gold-plated band that sits comfortably on the finger without slipping. The design draws inspiration from Mughal-era treasure rings, where precious stones were set close together to create an almost fabric-like surface of glittering light. An adjustable shank at the base ensures a perfect fit on most finger sizes, eliminating the guesswork of ring sizing. Wear it on your index finger for maximum impact, or on your middle finger to balance a layered ring stack. It pairs magnificently with Kundan or pearl necklace sets but is also strong enough to stand alone as a single statement. Each piece undergoes rigorous quality checks before dispatch.`,

    `Stackable rings have become the defining jewellery trend of this generation, and this set of Meenakari enamel-accented gold-plated rings is made for the art of layering. Each slender band carries a different motif — a lotus in peacock blue, a paisley in ruby red, a geometric repeat in ivory — unified by a shared 18–22K gold-plated base and colour palette. Wear all three stacked together on one finger for a bold, maximalist look, or spread them across multiple fingers for a more editorial effect. The delicate enamel work is hand-painted by artisans trained in the centuries-old Meenakari tradition of Rajasthan, making each ring a tiny work of art. Despite the intricacy of the surface, the rings are finished smooth on the inside for comfortable all-day wear. Perfect for festive occasions, ethnic fashion shoots and as a thoughtful artisan-craft gift. Each piece undergoes rigorous quality checks before dispatch.`,

    `Simplicity and elegance converge in this adjustable oxidised silver-finish ring, whose clean circular silhouette carries an intricate floral engraving that reveals itself up close. The oxidised finish creates deep contrast in the engraved channels, making the pattern read sharply without the need for stone setting. A single white crystal at the centre adds just enough sparkle to dress the ring up for evening events without making it feel overstated. The open-shank adjustable design fits sizes 5 through 9 comfortably, making it a no-fuss choice for gifting when you do not know the recipient's ring size. Despite the premium look, it is feather-light — perfect for all-day wear including office and daily ethnic dressing. It pairs naturally with oxidised silver sets, boho tribal jewellery and handloom weaves. An ideal daily wear ring that also transitions seamlessly to festive occasions. Each piece undergoes rigorous quality checks before dispatch.`,

    `This floral cocktail ring is a garden in miniature — a central stone bloom surrounded by petals of hand-set Kundan and delicate pearl stamens, rendered in vibrant 18–22K gold-plated detail. The ring face measures generously wide to showcase the full complexity of the design, while the tapered shank keeps the profile elegant and prevents the ring from looking disproportionately heavy on the hand. Available in a standard adjustable fit, it adapts to fingers of most widths. The warm gold plating is applied in multiple thin layers for depth of colour and resistance to daily wear. This ring is a particular favourite for mehendi and sangeet functions, where it photographs beautifully alongside the henna patterns of the hand. It also works as an elegant everyday ring for women who like their daily accessories to carry a little extra beauty. Each piece undergoes rigorous quality checks before dispatch.`,

    `For the woman who appreciates geometric precision as much as traditional craft, this angular Kundan ring offers a striking departure from the usual rounded floral forms. A hexagonal Kundan stone cluster set in a stepped gold-plated bezel sits on a structured double-band shank, creating a modernist aesthetic that references Art Deco as much as Indian temple architecture. The stone colour — a deep teal-green reminiscent of Colombian emerald — is vivid and eye-catching, making this ring a true conversation piece. Wear it alone on the ring finger for clean elegance, or pair it with a delicate band ring on an adjacent finger to frame it without competition. The combination of bold geometry and handcrafted stone-setting makes this ring a natural for women who occupy the intersection of contemporary fashion and ethnic heritage. Perfect for receptions, art events and high-fashion festive occasions. Each piece undergoes rigorous quality checks before dispatch.`,
  ],

  anklets: [
    `Adorn your feet with the timeless charm of this handcrafted gold-plated ghungroo anklet, where tradition meets meticulous artisanal skill. Rows of tiny bell drops (ghungroos) are strung along a substantial gold-plated chain in a design that echoes the classical payal worn by dancers and brides across centuries of Indian history. The gentle, musical sound the anklet produces with each step is one of its most beloved qualities — soft enough to be subtle, present enough to be felt. The main chain features alternating plain and engraved links, adding visual rhythm to the design. Crafted on a sturdy gold-plated brass base with a secure lobster-claw clasp and extender chain for adjustable fit, this anklet accommodates a range of ankle sizes comfortably. Wear it for weddings, sangeet nights, Diwali celebrations or simply to bring a touch of festive spirit to your everyday ethnic dressing. Each piece undergoes rigorous quality checks before dispatch.`,

    `This delicate dual-chain gold-plated anklet brings the elegance of fine jewellery design to the traditionally underserved space of foot adornment. Two parallel chains of different link styles — one a classic cable chain, the other a fine rope-twist — run together along the ankle, connected at intervals by tiny floral spacer charms. A small central pendant charm shaped like a mango (aamra) dangles at the front of the ankle, a nod to a motif that carries deep auspicious significance in Indian culture. The overall effect is light, refined and modern without losing its ethnic soul. Fully adjustable with a drop-extender at the clasp, it fits petite to broad ankles with equal grace. While it shines at festive and bridal occasions, it is light and understated enough for daily wear with kurta sets, palazzo pants and even casual jeans when dressed down. Each piece undergoes rigorous quality checks before dispatch.`,

    `Drawing from the Rajasthani tradition of heavily adorned Payal jewellery, this gold-plated statement anklet is bold, layered and utterly beautiful. Three rows of chains at varying widths are held together by ornate disc spacers engraved with the classic wheel-and-petal motif found in Rajasthani block prints and temple architecture. The outer row features a continuous line of small crystal-set charms, while the inner rows carry the structural, textured chain work that gives the piece its visual weight. Despite the layered appearance, the anklet is fabricated from lightweight alloy, making it wearable across full celebration days without ankle fatigue. Secure spring-ring closures on both ends ensure it stays in place during dance and movement. Best worn with open-toed footwear — jootis, flat sandals or heeled mojaris — to allow the full design to be admired. Ideal for bridal occasions, sangeet events and Navratri celebrations. Each piece undergoes rigorous quality checks before dispatch.`,

    `The simplest designs are often the most enduring, and this thin gold-plated chain anklet with sliding pearl and bead motifs proves that restraint can be the greatest luxury. A single, fine gold-plated cable chain carries a scatter of sliding pearl, crystal and 18–22K gold-toned bead charms that can be arranged by the wearer for a personalised look each time. The minimal silhouette means it works equally well layered with other anklets — pair it with a ghungroo payal or a bolder chain anklet and wear both on the same ankle for a curated stack. The fully adjustable length fits small to large ankles. As daily wear, it is barely-there and never snags on clothing; for festive occasions, layer it up to create a more abundant look. An ideal gifting choice for sisters, friends and daughters across all age groups. Each piece undergoes rigorous quality checks before dispatch.`,

    `This oxidised silver-finish anklet with turquoise stone drops is a celebration of the Tribal and Bohemian traditions that run deep in the folk jewellery of Rajasthan and Gujarat. Heavy-gauge flat links are joined by intricate figure-eight connectors, creating a substantial chain that carries visual weight without physical discomfort. At regular intervals, oval bezel-set turquoise glass drops add bursts of vibrant colour against the grey oxidised background — a contrast that photographs spectacularly. A single large turquoise charm hangs at the centre front as a focal point. Despite the tribal inspiration, the overall design is calibrated for wearability by contemporary women — the clasp is modern and secure, the length is adjustable, and the flat link profile does not catch on fabric. Wear it for ethnic events, beach festivals, outdoor weddings and Navratri celebrations where colour and craft are celebrated equally. Each piece undergoes rigorous quality checks before dispatch.`,
  ],
};

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

async function main() {
  console.log("Sirini Jewellery — Expand Product Descriptions (SEO)\n");

  // Verify word counts before running
  console.log("Template word count verification:");
  for (const [cat, templates] of Object.entries(TEMPLATES)) {
    const counts = templates.map(wordCount);
    console.log(`  ${cat}: [${counts.join(", ")}] words`);
  }
  console.log("");

  const products = await prisma.product.findMany({
    where: { category: { in: REAL_CATEGORIES } },
    select: { id: true, name: true, sku: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${products.length} real products to update.\n`);

  // Track per-category index for template rotation
  const catIndex: Record<string, number> = {};
  for (const cat of REAL_CATEGORIES) catIndex[cat] = 0;

  let updated = 0;
  let minWords = Infinity;
  let maxWords = 0;
  const sampledCategories = new Set<string>();

  for (const prod of products) {
    const templates = TEMPLATES[prod.category] ?? TEMPLATES["necklace-sets"];
    const idx = catIndex[prod.category] ?? 0;
    const description = templates[idx % templates.length];
    catIndex[prod.category] = idx + 1;

    const wc = wordCount(description);
    minWords = Math.min(minWords, wc);
    maxWords = Math.max(maxWords, wc);

    await prisma.product.update({
      where: { id: prod.id },
      data: { description },
    });
    updated++;

    // Print one sample per category
    if (!sampledCategories.has(prod.category)) {
      sampledCategories.add(prod.category);
      console.log(`── Sample [${prod.category}] ──────────────────────────────`);
      console.log(`Product: ${prod.name} (${prod.sku})`);
      console.log(`Words: ${wc}\n`);
      console.log(description);
      console.log("────────────────────────────────────────────────────\n");
    }
  }

  console.log(`Updated: ${updated} descriptions`);
  console.log(`Word count range: ${minWords}–${maxWords} words`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
