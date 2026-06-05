// Blog / Styling Guides content.
// Simple structured content (no MDX): each article body is an array of
// sections with an optional heading and one or more paragraphs.

export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  date: string; // ISO date (YYYY-MM-DD)
  readMins: number;
  body: ArticleSection[];
}

// Known brand imagery on Cloudinary, reused across articles.
const HERO_MODEL =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto,w_1200/v1780555156/sirini-jewellery/brand/hero-model.jpg";
const ARTISAN_CRAFT =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto,w_1200/v1780555156/sirini-jewellery/brand/artisan-craft.jpg";
const STORY_INFOGRAPHIC =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto,w_1200/v1780555156/sirini-jewellery/brand/story-infographic.jpg";

export const ARTICLES: Article[] = [
  {
    slug: "how-to-style-kundan-bridal",
    title: "How to Style a Kundan Necklace Set for Your Wedding",
    excerpt:
      "A complete guide to wearing Kundan on your big day — from matching your neckline to balancing your jhumkas, maang tikka and bangles for a flawless bridal look.",
    coverImage: HERO_MODEL,
    date: "2026-01-18",
    readMins: 6,
    body: [
      {
        paragraphs: [
          "A Kundan necklace set is, for many Indian brides, the single most important piece of jewellery they will ever wear. Built around uncut glass-set stones held in a fine bed of refined gold, Kundan carries centuries of royal heritage — which is exactly why it deserves a little thought when you style it for your wedding day. Worn well, it frames your face, complements your outfit and photographs beautifully under any light.",
          "The good news is that styling Kundan is less about following rigid rules and more about balance. Below is the approach we share with brides who shop our handcrafted bridal sets — a simple framework you can adapt to your outfit, your features and the mood of your celebration.",
        ],
      },
      {
        heading: "Start with your neckline",
        paragraphs: [
          "Your blouse or choli neckline decides everything. A deep V or sweetheart neckline pairs best with a layered or longer Kundan haar that follows the line of the body, while a high or boat neckline calls for a shorter choker-style set that sits close to the collarbone. If your outfit is heavily embroidered around the neck, choose a single statement necklace and keep the rest of your jewellery restrained so the two don't compete.",
          "As a rule of thumb: the busier the neckline, the simpler the necklace — and the plainer the neckline, the more room you have for a grand, multi-strand Kundan set.",
        ],
      },
      {
        heading: "Match metal tones to your outfit",
        paragraphs: [
          "Kundan's warm gold setting flatters traditional reds, maroons, deep greens and royal blues effortlessly. If you're wearing a pastel lehenga — blush, sage, ivory or powder blue — look for Kundan pieces with Meenakari enamel on the reverse or coloured stone accents that pick up a shade from your outfit. This subtle colour echo ties the whole look together without feeling matchy.",
        ],
      },
      {
        heading: "Build the rest of the set in layers",
        paragraphs: [
          "Bridal Kundan rarely travels alone. Once your necklace is chosen, add a maang tikka that mirrors its motif, then matching jhumkas or chandbalis. The trick is hierarchy: let one element lead. If your necklace is a heavy multi-layer rani haar, keep earrings to elegant studs or small jhumkas. If you prefer dramatic chandelier earrings, choose a slimmer necklace so your face isn't crowded.",
          "Finish with Kundan bangles or a kada stacked with plain gold-toned bangles for contrast, and a haath phool or ring to carry the detail down to your hands. Spreading the jewellery across the body keeps it from looking top-heavy in photographs.",
        ],
      },
      {
        heading: "Hair, makeup and the final check",
        paragraphs: [
          "An updo or side-swept style shows off a choker and earrings far better than loose hair, which can hide your necklace entirely. Keep makeup balanced — bold eyes with a softer lip, or a statement lip with softer eyes, so your features and your Kundan share the spotlight rather than fighting for it.",
          "Before you step out, do one last mirror check from a few feet away. Bridal Kundan is meant to be admired from across a room, so judge the overall silhouette, not just the close-up. When the necklace, earrings and tikka feel like one harmonious set rather than three separate pieces, you've nailed it.",
        ],
      },
      {
        heading: "Make it yours",
        paragraphs: [
          "Every bride carries her jewellery differently, and that's the point. Use these ideas as a starting line, not a finish line — then choose the Kundan set that makes you feel most like yourself on the most photographed day of your life. Explore our handcrafted bridal Kundan sets and find the one that's waiting for your moment.",
        ],
      },
    ],
  },
  {
    slug: "meenakari-kundan-polki-guide",
    title: "Meenakari vs Kundan vs Polki: A Guide to Traditional Indian Jewellery",
    excerpt:
      "Three legendary jewellery techniques, often confused. Learn what sets Meenakari, Kundan and Polki apart — how each is made, how to spot them, and which suits you.",
    coverImage: ARTISAN_CRAFT,
    date: "2026-02-05",
    readMins: 7,
    body: [
      {
        paragraphs: [
          "Walk into any Indian jewellery boutique and you'll hear three words used almost interchangeably: Meenakari, Kundan and Polki. They often appear on the same piece, which is part of the confusion — but each is a distinct craft with its own history, technique and look. Understanding the difference helps you shop smarter and appreciate the artistry behind every set.",
        ],
      },
      {
        heading: "Kundan: the art of the setting",
        paragraphs: [
          "Kundan is, strictly speaking, a setting technique rather than a stone. The word refers to highly refined, almost pure gold that is worked into thin foils and used to hold gemstones or glass in place — no prongs, no glue, just expertly hammered metal. This craft dates back to the Mughal courts of Rajasthan and Gujarat, where it adorned royalty.",
          "In modern handcrafted jewellery, Kundan most often describes pieces set with faceted glass or semi-precious stones held in that signature gold bezel. The result is bright, reflective and intricate — ideal for brides and grand festive occasions where you want jewellery that catches every light.",
        ],
      },
      {
        heading: "Polki: the uncut diamond cousin",
        paragraphs: [
          "Polki uses the same Kundan setting method, but with one defining difference: the stones are uncut, unpolished natural diamonds in their raw form. Because the diamonds are left close to their natural state, Polki has a softer, milky, antique glow rather than the sharp sparkle of cut stones.",
          "Traditionally Polki is the more precious and expensive of the family. In fashion and gold-plated jewellery, the look is recreated with uncut-style stones to give that same heirloom, old-world elegance at an accessible price — perfect if you love a vintage, understated shimmer.",
        ],
      },
      {
        heading: "Meenakari: colour on the canvas of metal",
        paragraphs: [
          "Meenakari is the odd one out, because it isn't about stones at all — it's the art of enamelling. Artisans fuse vibrant coloured enamels onto metal at high heat, painting intricate florals, peacocks and paisleys in jewel tones of green, red, blue and white. The craft flourished in Jaipur and remains one of India's most beloved decorative techniques.",
          "You'll most often see Meenakari on the reverse of Kundan and Polki pieces — a hidden burst of colour that means the jewellery is beautiful from both sides. Worn alone, Meenakari earrings and necklaces bring a playful, festive pop of colour that pairs wonderfully with both traditional and contemporary outfits.",
        ],
      },
      {
        heading: "How they work together",
        paragraphs: [
          "The reason these three are so often confused is that the finest pieces combine all of them: Kundan or Polki stones set on the front, Meenakari enamel hand-painted on the back. This two-sided craftsmanship is a hallmark of quality and a tradition our Mumbai artisans carry forward in every set.",
        ],
      },
      {
        heading: "Which one is right for you?",
        paragraphs: [
          "Choose Kundan when you want bright, statement sparkle for weddings and big celebrations. Reach for Polki when you love a soft, antique, heirloom feel. And pick Meenakari when you want colour, character and pieces that work as easily with a saree as with a kurta. Many of our designs let you have all three at once — explore the collection and see how the crafts come alive in a single piece.",
        ],
      },
    ],
  },
  {
    slug: "jewellery-care-guide",
    title: "Jewellery Care 101: Keep Your Gold-Plated Pieces Shining",
    excerpt:
      "Gold-plated and Kundan jewellery can last for years with the right care. Here's how to store, clean and protect your pieces so they stay bright wear after wear.",
    coverImage: STORY_INFOGRAPHIC,
    date: "2026-03-12",
    readMins: 5,
    body: [
      {
        paragraphs: [
          "Beautiful jewellery deserves to last. Gold-plated, Kundan and Meenakari pieces are handcrafted with delicate stones, enamel and fine metal layers — all of which respond to how you store and care for them. The habits below are simple, take seconds, and can add years of shine to every piece you own.",
        ],
      },
      {
        heading: "The golden rule: last on, first off",
        paragraphs: [
          "The single most important habit is timing. Put your jewellery on last — after your makeup, perfume, hairspray and lotion have fully dried — and take it off first when you get home. Cosmetics, fragrances and natural skin oils are the biggest enemies of gold plating; their chemicals slowly dull the finish and can loosen set stones over time. Letting them dry before you accessorise makes a real difference.",
        ],
      },
      {
        heading: "Keep it dry",
        paragraphs: [
          "Water and humidity are the fastest way to tarnish plated jewellery. Always remove your pieces before washing your hands, showering, swimming or working out. Sweat is mildly acidic and, like water, accelerates dulling. If your jewellery does get wet, gently pat it completely dry with a soft cloth before storing it away.",
        ],
      },
      {
        heading: "Clean gently, never harshly",
        paragraphs: [
          "Skip ultrasonic cleaners, harsh chemical dips and abrasive cloths — they are designed for solid gold and will strip plating and damage enamel. Instead, wipe each piece with a soft, dry microfibre or cotton cloth after every wear to remove oils and restore shine. For a deeper clean, use a barely damp cloth and dry immediately. Avoid soaking Kundan and Meenakari pieces, as moisture can seep behind the stones and lift the enamel.",
        ],
      },
      {
        heading: "Store each piece separately",
        paragraphs: [
          "Jewellery scratches jewellery. Store each piece in its own soft pouch or a lined box compartment so harder stones don't scuff softer metal and chains don't tangle. Adding a small silica gel sachet to your jewellery box keeps moisture at bay. Keep everything out of direct sunlight and away from heat, both of which can fade Meenakari enamel over time.",
        ],
      },
      {
        heading: "A little routine goes a long way",
        paragraphs: [
          "Treat your jewellery the way you'd treat a fine silk saree: with gentle, consistent care rather than occasional heavy cleaning. A quick wipe after wearing, careful storage and keeping pieces away from water and chemicals will keep your gold-plated and Kundan jewellery looking as radiant as the day it arrived — ready for every occasion, year after year.",
        ],
      },
    ],
  },
  {
    slug: "festive-jewellery-edit",
    title: "Festive Jewellery Edit: What to Wear This Navratri & Diwali",
    excerpt:
      "From garba nights to Diwali dinners, here's how to build a festive jewellery edit — jhumkas, chokers, oxidised pieces and Kundan sets for every celebration.",
    coverImage: HERO_MODEL,
    date: "2026-04-02",
    readMins: 6,
    body: [
      {
        paragraphs: [
          "Festival season is when jewellery truly comes alive. Between the colour and movement of Navratri and the warmth and glow of Diwali, every outfit deserves the right finishing touch. The key to a festive edit is versatility — a handful of pieces that mix, match and carry you from a high-energy garba night to an intimate Diwali dinner. Here's how to build yours.",
        ],
      },
      {
        heading: "Navratri: jewellery that moves with you",
        paragraphs: [
          "Garba and dandiya nights call for jewellery that's bold, lightweight and full of motion. Oxidised silver-tone pieces, mirror-work jewellery and chunky tribal designs suit the playful, folk energy of Navratri beautifully — and they're sturdy enough to dance in.",
          "Layer long oxidised necklaces over a backless choli, stack bangles up both arms, and let big jhumkas or chandbalis swing as you spin. A maang tikka or matha patti completes the festive Gujarati look. Because the dancing is energetic, choose secure clasps and avoid your most delicate Kundan here — save that for the calmer evenings.",
        ],
      },
      {
        heading: "Diwali: warmth, glow and a little grandeur",
        paragraphs: [
          "Diwali is softer and more elegant, lit by diyas and fairy lights — the perfect backdrop for jewellery that glimmers. This is the moment for your Kundan and Polki pieces, whose warm gold settings and reflective stones come alive in candlelight.",
          "For a Diwali saree or anarkali, a Kundan choker with matching jhumkas strikes the ideal balance of festive and refined. If your outfit is richly embroidered, let a single statement necklace do the talking. Meenakari pieces, with their jewel-toned enamel, are a gorgeous way to echo the colours of your outfit and the festive decor.",
        ],
      },
      {
        heading: "The mix-and-match capsule",
        paragraphs: [
          "You don't need a new set for every event. A smart festive capsule is built around five hardworking pieces: one Kundan choker, one pair of versatile jhumkas, a stack of mixed bangles, one pair of statement chandbalis, and a maang tikka. From these, you can create a fresh look for every night of the season.",
          "The trick is to rotate the hero piece. Lead with the choker one evening, the chandbalis the next, the bangles another — so the same jewellery never feels repeated even across a packed festive calendar.",
        ],
      },
      {
        heading: "Final touches",
        paragraphs: [
          "Whatever you wear, let the occasion guide the intensity: high-energy and playful for Navratri, warm and luminous for Diwali. With a few well-chosen handcrafted pieces, you'll be ready for every celebration the season brings. Explore our festive edit and find the jhumkas, chokers and Kundan sets that will carry you through the brightest nights of the year.",
        ],
      },
    ],
  },
];

export function getAllArticles(): Article[] {
  // Newest first.
  return [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
}

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
