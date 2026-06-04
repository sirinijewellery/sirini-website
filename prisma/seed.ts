import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Categories ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.category.upsert({ where: { slug: "necklace-sets" },       update: {}, create: { name: "Necklace Sets",          slug: "necklace-sets" } }),
    prisma.category.upsert({ where: { slug: "necklaces" },           update: {}, create: { name: "Necklaces",              slug: "necklaces" } }),
    prisma.category.upsert({ where: { slug: "earrings" },            update: {}, create: { name: "Earrings",               slug: "earrings" } }),
    prisma.category.upsert({ where: { slug: "bangles-bracelets" },   update: {}, create: { name: "Bangles & Bracelets",    slug: "bangles-bracelets" } }),
    prisma.category.upsert({ where: { slug: "rings" },               update: {}, create: { name: "Rings",                  slug: "rings" } }),
    prisma.category.upsert({ where: { slug: "sets" },                update: {}, create: { name: "Sets",                   slug: "sets" } }),
    prisma.category.upsert({ where: { slug: "maang-tikka-bridal" },  update: {}, create: { name: "Maang Tikka / Bridal",  slug: "maang-tikka-bridal" } }),
    prisma.category.upsert({ where: { slug: "ethnic-jewellery" },    update: {}, create: { name: "Ethnic Jewellery",       slug: "ethnic-jewellery" } }),
  ]);
  console.log("✓ Categories seeded");

  // ── Admin user ───────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  await prisma.user.upsert({
    where:  { email: "admin@sirinijewellery.com" },
    update: {},
    create: { email: "admin@sirinijewellery.com", name: "Admin", passwordHash: adminPassword, isAdmin: true },
  });
  console.log("✓ Admin user seeded");

  // ── Products ────────────────────────────────────────────────────────────────
  const products = [

    // ── NECKLACE SETS ──────────────────────────────────────────────────────────
    { sku: "SRN-NS-001", name: "Kundan Choker Necklace Set",          slug: "kundan-choker-necklace-set",          category: "Necklace Sets",       material: "Kundan",                price: 1499, badge: "HOT",  isFeatured: true,  description: "Stunning Kundan choker paired with matching drop earrings. Ideal for weddings, receptions, and festive occasions. Intricate stone setting in rose gold tone." },
    { sku: "SRN-NS-002", name: "Meenakari Bridal Necklace Set",       slug: "meenakari-bridal-necklace-set",       category: "Necklace Sets",       material: "Meenakari",             price: 2299, badge: "NEW",  isFeatured: true,  description: "Traditional Rajasthani Meenakari work in vibrant greens and reds. Includes long necklace with matching jhumka earrings. A showstopper for brides." },
    { sku: "SRN-NS-003", name: "Pearl & Antique Gold Necklace Set",   slug: "pearl-antique-gold-necklace-set",     category: "Necklace Sets",       material: "Pearl & Antique Gold",  price: 1299, badge: null,  isFeatured: false, description: "Elegant fresh-water pearl necklace with antique gold accents and matching pearl stud earrings. Perfect for day-to-night wear." },
    { sku: "SRN-NS-004", name: "Temple Jewellery Necklace Set",       slug: "temple-jewellery-necklace-set",       category: "Necklace Sets",       material: "Gold Plated",           price: 1799, badge: null,  isFeatured: true,  description: "South Indian temple jewellery-inspired set with intricate deity motifs. Gold-plated brass with ruby-red stones. Includes necklace and earrings." },
    { sku: "SRN-NS-005", name: "Oxidised Silver Boho Necklace Set",   slug: "oxidised-silver-boho-necklace-set",   category: "Necklace Sets",       material: "Oxidised Silver",       price: 999,  badge: null,  isFeatured: false, description: "Oxidised silver layered necklace with tribal motifs, paired with matching jhumka earrings. Bohemian style for everyday wear." },
    { sku: "SRN-NS-006", name: "Polki Uncut Diamond Style Set",       slug: "polki-uncut-diamond-style-set",       category: "Necklace Sets",       material: "Polki",                 price: 1999, badge: "HOT",  isFeatured: false, description: "Royal Polki-inspired uncut diamond style necklace with matching earrings. Elaborate gold-tone setting for festive and bridal occasions." },
    { sku: "SRN-NS-007", name: "Floral Kundan Necklace Set",          slug: "floral-kundan-necklace-set",          category: "Necklace Sets",       material: "Kundan",                price: 1649, badge: null,  isFeatured: false, description: "Delicate floral Kundan necklace with emerald-green and pearl accents, paired with matching stud earrings. Versatile for mehendi to reception." },
    { sku: "SRN-NS-008", name: "Layered Pearl Necklace Set",          slug: "layered-pearl-necklace-set",          category: "Necklace Sets",       material: "Pearl",                 price: 1399, badge: "NEW",  isFeatured: false, description: "Multi-strand layered pearl necklace with gold separator beads. Includes matching drop earrings. Timeless elegance for sarees and salwars." },
    { sku: "SRN-NS-009", name: "Antique Hasli Necklace Set",          slug: "antique-hasli-necklace-set",          category: "Necklace Sets",       material: "Antique Gold",          price: 1549, badge: null,  isFeatured: true,  description: "Traditional hasli (rigid choker) necklace in antique gold finish with intricate filigree work. Includes matching chandbali earrings." },
    { sku: "SRN-NS-010", name: "Gold Plated Rani Haar Set",           slug: "gold-plated-rani-haar-set",           category: "Necklace Sets",       material: "Gold Plated",           price: 2499, badge: "HOT",  isFeatured: true,  description: "Long Rani Haar necklace with multiple strings of gold beads and pendant, paired with matching jhumka earrings. Statement jewellery for special occasions." },

    // ── NECKLACES ──────────────────────────────────────────────────────────────
    { sku: "SRN-NK-001", name: "Rose Gold Layered Necklace",          slug: "rose-gold-layered-necklace",          category: "Necklaces",           material: "Rose Gold Plated",      price: 899,  badge: "NEW",  isFeatured: true,  description: "Elegant layered necklace in rose gold tone with delicate chain links. Lightweight and perfect for everyday wear with western or ethnic outfits." },
    { sku: "SRN-NK-002", name: "Gold Tone Choker Necklace",           slug: "gold-tone-choker-necklace",           category: "Necklaces",           material: "Gold Plated",           price: 749,  badge: "SALE", isFeatured: false, description: "Trendy choker necklace in bright gold tone with geometric pattern. Adjustable length, suitable for all neck sizes." },
    { sku: "SRN-NK-003", name: "Antique Pendant Necklace",            slug: "antique-pendant-necklace",            category: "Necklaces",           material: "Antique Gold",          price: 849,  badge: null,  isFeatured: false, description: "Antique gold-finish pendant necklace with intricate floral motif and dangling pearls. Pairs well with ethnic kurtas and sarees." },
    { sku: "SRN-NK-004", name: "Meenakari Long Necklace",             slug: "meenakari-long-necklace",             category: "Necklaces",           material: "Meenakari",             price: 1099, badge: null,  isFeatured: false, description: "40-inch long Meenakari necklace in peacock blue and green enamel work. Can be layered or worn as a single strand opera necklace." },
    { sku: "SRN-NK-005", name: "Diamond-Look Solitaire Necklace",     slug: "diamond-look-solitaire-necklace",     category: "Necklaces",           material: "Silver Plated",         price: 699,  badge: null,  isFeatured: false, description: "Delicate solitaire pendant necklace with brilliant-cut crystal stone. Minimalist design perfect for everyday and office wear." },
    { sku: "SRN-NK-006", name: "Oxidised Goddess Lakshmi Necklace",   slug: "oxidised-goddess-lakshmi-necklace",   category: "Necklaces",           material: "Oxidised Silver",       price: 799,  badge: null,  isFeatured: false, description: "Detailed oxidised silver necklace with Goddess Lakshmi pendant and intricate chain work. Spiritual and beautiful." },

    // ── EARRINGS ───────────────────────────────────────────────────────────────
    { sku: "SRN-ER-001", name: "Pearl Drop Earrings",                 slug: "pearl-drop-earrings",                 category: "Earrings",            material: "Pearl & Gold Plated",   price: 649,  badge: null,  isFeatured: true,  description: "Classic pearl drop earrings with gold tone hooks and a single fresh-water pearl teardrop. Elegant for weddings, parties, and formal events." },
    { sku: "SRN-ER-002", name: "Terracotta Jhumka Earrings",          slug: "terracotta-jhumka-earrings",          category: "Earrings",            material: "Terracotta",            price: 449,  badge: null,  isFeatured: true,  description: "Handcrafted terracotta jhumka earrings with hand-painted floral motifs. Lightweight and eco-friendly. A unique addition to your ethnic wardrobe." },
    { sku: "SRN-ER-003", name: "Kundan Chandbali Earrings",           slug: "kundan-chandbali-earrings",           category: "Earrings",            material: "Kundan",                price: 849,  badge: "HOT",  isFeatured: true,  description: "Traditional chandbali earrings with Kundan stone setting in crescent moon shape. Gold-plated with pearl danglers. Perfect for bridal functions." },
    { sku: "SRN-ER-004", name: "Gold Pearl Jhumka Earrings",          slug: "gold-pearl-jhumka-earrings",          category: "Earrings",            material: "Pearl & Gold Plated",   price: 699,  badge: null,  isFeatured: false, description: "Classic gold jhumka earrings adorned with fresh-water pearls and intricate filigree work. Comfortable to wear all day." },
    { sku: "SRN-ER-005", name: "Oxidised Silver Jhumka Earrings",     slug: "oxidised-silver-jhumka-earrings",     category: "Earrings",            material: "Oxidised Silver",       price: 549,  badge: null,  isFeatured: false, description: "Traditional oxidised silver jhumka earrings with intricate tribal motifs and delicate chain details. Boho-ethnic style." },
    { sku: "SRN-ER-006", name: "Meenakari Jhumka Earrings",           slug: "meenakari-jhumka-earrings",           category: "Earrings",            material: "Meenakari",             price: 629,  badge: "NEW",  isFeatured: false, description: "Vibrant Meenakari jhumka earrings in peacock design with blue, green, and red enamel work. Handcrafted in Rajasthan." },
    { sku: "SRN-ER-007", name: "Statement Gold Hoop Earrings",        slug: "statement-gold-hoop-earrings",        category: "Earrings",            material: "Gold Plated",           price: 499,  badge: null,  isFeatured: false, description: "Large geometric gold hoop earrings with intricate lattice pattern. Lightweight design for all-day wear. Bold statement piece." },
    { sku: "SRN-ER-008", name: "Floral Gold Stud Earrings",           slug: "floral-gold-stud-earrings",           category: "Earrings",            material: "Gold Plated",           price: 399,  badge: null,  isFeatured: false, description: "Delicate floral stud earrings in gold plating with tiny crystal accents. Minimalist yet beautiful for everyday wear." },
    { sku: "SRN-ER-009", name: "Traditional Chand Bali Earrings",     slug: "traditional-chand-bali-earrings",     category: "Earrings",            material: "Gold Plated",           price: 749,  badge: null,  isFeatured: false, description: "Iconic chand bali (moon earrings) in gold plating with Kundan stone accents and pearl drops. Timeless ethnic jewellery." },
    { sku: "SRN-ER-010", name: "Antique Temple Earrings",             slug: "antique-temple-earrings",             category: "Earrings",            material: "Antique Gold",          price: 799,  badge: "NEW",  isFeatured: false, description: "South Indian temple jewellery-inspired earrings with deity motifs in antique gold finish and ruby-red stone accents." },

    // ── BANGLES & BRACELETS ────────────────────────────────────────────────────
    { sku: "SRN-BN-001", name: "Oxidised Silver Bangle Set",          slug: "oxidised-silver-bangle-set",          category: "Bangles & Bracelets", material: "Oxidised Silver",       price: 799,  badge: "HOT",  isFeatured: true,  description: "Set of 6 oxidised silver bangles with traditional tribal motifs and intricate filigree work. Stackable design, perfect for both casual and festive wear." },
    { sku: "SRN-BN-002", name: "Kundan Bangle Set",                   slug: "kundan-bangle-set",                   category: "Bangles & Bracelets", material: "Kundan",                price: 1199, badge: "HOT",  isFeatured: true,  description: "Set of 4 wide Kundan bangles with multi-coloured stone settings in green, red, and white. Gold-plated base. Bridal-worthy statement jewellery." },
    { sku: "SRN-BN-003", name: "Meenakari Bangle Set",                slug: "meenakari-bangle-set",                category: "Bangles & Bracelets", material: "Meenakari",             price: 999,  badge: null,  isFeatured: false, description: "Set of 6 Meenakari enamel bangles in vibrant colours — peacock blue, parrot green, and gold. Handcrafted in Jaipur." },
    { sku: "SRN-BN-004", name: "Gold Plated Kangan Set",              slug: "gold-plated-kangan-set",              category: "Bangles & Bracelets", material: "Gold Plated",           price: 849,  badge: null,  isFeatured: false, description: "Set of 4 gold-plated traditional kangan bangles with pearl and crystal accents. Lightweight and ideal for daily wear." },
    { sku: "SRN-BN-005", name: "Pearl & Crystal Bracelet",            slug: "pearl-crystal-bracelet",              category: "Bangles & Bracelets", material: "Pearl & Crystal",       price: 599,  badge: null,  isFeatured: false, description: "Elegant bracelet with fresh-water pearls and Swarovski-style crystals on a gold-plated setting. Perfect for western and ethnic fusion." },
    { sku: "SRN-BN-006", name: "Beaded Boho Bracelet Set",            slug: "beaded-boho-bracelet-set",            category: "Bangles & Bracelets", material: "Beaded",                price: 449,  badge: null,  isFeatured: false, description: "Set of 3 handmade beaded boho bracelets with semi-precious stones — turquoise, coral, and jade. Stack them for a carefree look." },

    // ── RINGS ──────────────────────────────────────────────────────────────────
    { sku: "SRN-RG-001", name: "Kundan Finger Ring",                  slug: "kundan-finger-ring",                  category: "Rings",               material: "Kundan",                price: 549,  badge: null,  isFeatured: false, description: "Stunning Kundan ring with floral design and multi-coloured stone setting. Adjustable band fits most finger sizes." },
    { sku: "SRN-RG-002", name: "Adjustable Floral Gold Ring",         slug: "adjustable-floral-gold-ring",         category: "Rings",               material: "Gold Plated",           price: 399,  badge: null,  isFeatured: false, description: "Delicate floral motif gold-plated ring with tiny crystal centre stone. Open adjustable band — one size fits all." },
    { sku: "SRN-RG-003", name: "Meenakari Statement Ring",            slug: "meenakari-statement-ring",            category: "Rings",               material: "Meenakari",             price: 499,  badge: "NEW",  isFeatured: false, description: "Wide-band statement ring with blue Meenakari enamel work and golden borders. Adjustable size. A conversation starter." },
    { sku: "SRN-RG-004", name: "Pearl Cocktail Ring",                 slug: "pearl-cocktail-ring",                 category: "Rings",               material: "Pearl & Gold Plated",   price: 449,  badge: null,  isFeatured: false, description: "Elegant cocktail ring with a large central pearl and gold-plated floral setting. Adjustable band for versatile fit." },
    { sku: "SRN-RG-005", name: "Temple Design Gold Ring",             slug: "temple-design-gold-ring",             category: "Rings",               material: "Gold Plated",           price: 529,  badge: null,  isFeatured: false, description: "South Indian temple jewellery inspired ring with goddess motif and ruby-red stone accent. Adjustable band." },

    // ── SETS ───────────────────────────────────────────────────────────────────
    { sku: "SRN-ST-001", name: "Bridal Jewellery Set",                slug: "bridal-jewellery-set",                category: "Sets",                material: "Gold Plated",           price: 2499, badge: "HOT",  isFeatured: true,  description: "Complete bridal set including necklace, earrings, and maang tikka in matching gold-plated design with Kundan and pearl accents." },
    { sku: "SRN-ST-002", name: "Antique Gold Jewellery Set",          slug: "antique-gold-jewellery-set",          category: "Sets",                material: "Antique Gold",          price: 1999, badge: null,  isFeatured: true,  description: "Complete 3-piece antique gold jewellery set — necklace, earrings, and bangles. Traditional design with modern finish. Suitable for mehendi and sangeet." },
    { sku: "SRN-ST-003", name: "Royal Kundan Bridal Set",             slug: "royal-kundan-bridal-set",             category: "Sets",                material: "Kundan",                price: 2999, badge: "HOT",  isFeatured: false, description: "Exquisite 5-piece royal Kundan bridal set — necklace, earrings, maang tikka, bangles, and nose ring. The complete bridal look in one set." },
    { sku: "SRN-ST-004", name: "Minimalist Gold Set",                 slug: "minimalist-gold-set",                 category: "Sets",                material: "Gold Plated",           price: 1499, badge: null,  isFeatured: false, description: "Elegant minimalist 3-piece set — thin layered necklace, stud earrings, and delicate bracelet. For the modern bride who prefers understated luxury." },
    { sku: "SRN-ST-005", name: "Festive Meenakari Set",               slug: "festive-meenakari-set",               category: "Sets",                material: "Meenakari",             price: 1799, badge: "NEW",  isFeatured: false, description: "Vibrant 3-piece Meenakari set in peacock design — necklace, jhumka earrings, and matching bangle. Perfect for Navratri and Diwali." },

    // ── MAANG TIKKA / BRIDAL ───────────────────────────────────────────────────
    { sku: "SRN-MT-001", name: "Meenakari Maang Tikka",              slug: "meenakari-maang-tikka",               category: "Maang Tikka / Bridal", material: "Meenakari",            price: 699,  badge: "NEW",  isFeatured: false, description: "Vibrant Meenakari maang tikka in traditional Rajasthani style with peacock motif in green and blue enamel. Adjustable chain." },
    { sku: "SRN-MT-002", name: "Kundan Maang Tikka",                 slug: "kundan-maang-tikka",                  category: "Maang Tikka / Bridal", material: "Kundan",               price: 849,  badge: null,  isFeatured: true,  description: "Bridal Kundan maang tikka with teardrop pendant and multi-coloured stone setting. Adjustable chain length. Perfect for brides and bridesmaids." },
    { sku: "SRN-MT-003", name: "Pearl Maang Tikka",                  slug: "pearl-maang-tikka",                   category: "Maang Tikka / Bridal", material: "Pearl & Gold Plated",  price: 749,  badge: null,  isFeatured: false, description: "Elegant pearl maang tikka with a cluster of fresh-water pearls and gold-plated setting. Simple yet sophisticated for receptions." },
    { sku: "SRN-MT-004", name: "Gold Plated Bridal Tikka",           slug: "gold-plated-bridal-tikka",            category: "Maang Tikka / Bridal", material: "Gold Plated",          price: 999,  badge: null,  isFeatured: false, description: "Heavy gold-plated bridal maang tikka with large central stone, intricate filigree border, and pearl drops. A showstopper for brides." },
    { sku: "SRN-MT-005", name: "Long Chain Matha Patti",             slug: "long-chain-matha-patti",              category: "Maang Tikka / Bridal", material: "Gold Plated",          price: 1299, badge: "HOT",  isFeatured: false, description: "Bridal matha patti (head jewellery) with central tikka and cascading side chains. Covers the full forehead. Ideal for brides and lehenga looks." },

    // ── ETHNIC JEWELLERY ───────────────────────────────────────────────────────
    { sku: "SRN-EJ-001", name: "Terracotta Jhumka Earrings",         slug: "terracotta-jhumka-earrings-ethnic",    category: "Ethnic Jewellery",    material: "Terracotta",            price: 449,  badge: null,  isFeatured: true,  description: "Handcrafted terracotta jhumka earrings with ethnic motifs painted in natural colours. Eco-friendly and lightweight for all-day wear." },
    { sku: "SRN-EJ-002", name: "Tribal Necklace Set",                slug: "tribal-necklace-set",                 category: "Ethnic Jewellery",    material: "Oxidised Silver",       price: 899,  badge: null,  isFeatured: false, description: "Inspired by tribal jewellery traditions of central India. Oxidised silver necklace with geometric patterns and matching earrings." },
    { sku: "SRN-EJ-003", name: "Mirror Work Thread Earrings",        slug: "mirror-work-thread-earrings",         category: "Ethnic Jewellery",    material: "Thread & Mirror",       price: 349,  badge: null,  isFeatured: false, description: "Handmade thread earrings with tiny mirror work and tassel details in vibrant colours. Lightweight and perfect for summer festivals." },
    { sku: "SRN-EJ-004", name: "Dhokra Art Cuff Bracelet",           slug: "dhokra-art-cuff-bracelet",            category: "Ethnic Jewellery",    material: "Dhokra",                price: 649,  badge: null,  isFeatured: false, description: "Handcrafted Dhokra art cuff bracelet using the ancient lost-wax casting technique from Chhattisgarh. Each piece is unique." },
    { sku: "SRN-EJ-005", name: "Warli Art Necklace",                 slug: "warli-art-necklace",                  category: "Ethnic Jewellery",    material: "Wood & Terracotta",     price: 749,  badge: "NEW",  isFeatured: false, description: "Necklace featuring hand-painted Warli tribal art motifs from Maharashtra on terracotta pendants. Unique wearable art." },
  ];

  let created = 0;
  for (const p of products) {
    const product = await prisma.product.upsert({
      where:  { sku: p.sku },
      update: {},
      create: { ...p, images: JSON.stringify([]) },
    });

    // Variants — size-based for rings & bangles, colour-based for everything else
    if (p.category === "Rings") {
      const sizes = ["5", "6", "7", "8", "Free Size"];
      for (let i = 0; i < sizes.length; i++) {
        await prisma.productVariant.upsert({
          where:  { id: `${product.id}-sz${i}` },
          update: {},
          create: { id: `${product.id}-sz${i}`, productId: product.id, size: sizes[i], stockQuantity: 20 },
        });
      }
    } else if (p.category === "Bangles & Bracelets") {
      const sizes = ["2.4", "2.6", "2.8"];
      for (let i = 0; i < sizes.length; i++) {
        await prisma.productVariant.upsert({
          where:  { id: `${product.id}-bsz${i}` },
          update: {},
          create: { id: `${product.id}-bsz${i}`, productId: product.id, size: sizes[i], stockQuantity: 25 },
        });
      }
    } else {
      const colours = ["Gold Plated", "Rose Gold Plated"];
      for (let i = 0; i < colours.length; i++) {
        await prisma.productVariant.upsert({
          where:  { id: `${product.id}-cl${i}` },
          update: {},
          create: { id: `${product.id}-cl${i}`, productId: product.id, colour: colours[i], stockQuantity: 30 },
        });
      }
    }
    created++;
  }

  console.log(`✓ Seeded ${created} products`);
  console.log("Seed complete ✓");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
