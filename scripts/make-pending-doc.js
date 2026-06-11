/**
 * make-pending-doc.js  (v2 — 11 June 2026)
 * Generates the Word document of pending tasks for Sirini Jewellery.
 * Run: node scripts/make-pending-doc.js
 * Output: D:\Owner\Desktop\Sirini Pending Tasks.docx
 */
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, TableLayoutType, VerticalAlign, convertInchesToTwip,
  UnderlineType,
} = require("docx");
const fs = require("fs");
const path = require("path");

/* ─────────────────────────────── helpers ──────────────────────────────── */

const MAROON  = "5C1A24";
const GOLD    = "B76E79";
const LGRAY   = "F5F5F5";
const GREENBG = "EAF7EF";
const RED     = "C0392B";
const GREEN   = "1E7B45";
const BLUE    = "2980B9";
const WHITE   = "FFFFFF";

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: MAROON })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 4 } },
  });
}

function h3(text, color = MAROON) {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text, bold: true, size: 20, color })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 18, ...opts })],
  });
}

function bullet(text, bold = false) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 18, bold })],
  });
}

function spacer(lines = 1) {
  return new Paragraph({ spacing: { before: 0, after: lines * 120 }, children: [new TextRun("")] });
}

function inputLine(label, defaultText = "") {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 18 }),
      new TextRun({ text: defaultText || "____________________________", size: 18, underline: { type: UnderlineType.SINGLE, color: "CCCCCC" } }),
    ],
  });
}

function cell(text, opts = {}) {
  const {
    bold = false, size = 18, color = "000000", bg = WHITE,
    width, colspan = 1, shade = false, italic = false,
  } = opts;
  return new TableCell({
    columnSpan: colspan,
    shading: shade ? { fill: bg, type: ShadingType.CLEAR } : { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    ...(width ? { width: { size: width, type: WidthType.DXA } } : {}),
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: String(text), bold, size, color, italic })],
      }),
    ],
  });
}

function headerRow(labels, widths = []) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) =>
      cell(l, { bold: true, size: 18, color: WHITE, bg: MAROON, shade: true, width: widths[i] })
    ),
  });
}

function dataRow(vals, opts = [], rowBg = WHITE) {
  return new TableRow({
    children: vals.map((v, i) =>
      cell(v, { size: 18, bg: rowBg, shade: rowBg !== WHITE, ...(opts[i] || {}) })
    ),
  });
}

function makeTable(rows) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 0 } },
    children: [new TextRun("")],
  });
}

/* ═══════════════════════════ BUILD DOCUMENT ═══════════════════════════ */

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 18, color: "1A1A1A" } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left:   convertInchesToTwip(1.1),
            right:  convertInchesToTwip(1.1),
          },
        },
      },
      children: [

        /* ══════════════════════ COVER ══════════════════════════════════ */
        spacer(2),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 160 },
          children: [new TextRun({ text: "Sirini Jewellery", bold: true, size: 52, color: MAROON })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: "Pending Tasks — Version 2", size: 28, color: GOLD })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
          children: [new TextRun({ text: "Updated: 11 June 2026  •  sirinijewellery.com", size: 18, color: "888888" })],
        }),
        divider(),

        /* ══════════════════════ COMPLETED ═══════════════════════════════ */
        h2("✅ Recently Completed (no action needed)"),
        spacer(),
        makeTable([
          headerRow(["Done", "What"], [800, 8800]),
          ...[
            "All 8 placeholder products priced — selling = 2× your wholesale, e.g. Vivaah Polki ₹7,450 (struck ₹12,899)",
            "Every product (162) now has its OWN strikethrough gap (₹1,500–₹6,000, varied) — no more uniform 50%-off everywhere",
            "All 33 generic product names renamed (e.g. \"Necklace Set 01NS706\" → \"Bridal Brass Kundan Choker Set\")",
            "Cover images switched to the decorative styled shot for all products",
            "Admin: hover any product image → ★ Cover button to change the cover anytime",
            "Full security audit — 27 issues fixed incl. 2 critical (payment amount bypass, review XSS)",
            "Premium animations site-wide (hero drift, hover sweeps, cart pop, drawer cascade) — colours/layouts untouched",
            "Location permission popup removed",
            "Order IDs now SR1, SR2, … • COD/online payment bug fixed • free gift from ₹4,000",
          ].map((t, i) =>
            dataRow(["✓", t], [{ bold: true, color: GREEN }, {}], i % 2 === 0 ? GREENBG : WHITE)
          ),
        ]),

        divider(),

        /* ══════════════════════ 1. MATERIAL VERIFY ══════════════════════ */
        h2("1. Confirm Material for 2 Products  (FILL IN)"),
        para("These two were auto-detected as Gold Plated. Tick if correct, or write the right material:"),
        spacer(),
        makeTable([
          headerRow(["SKU", "Product Name", "Detected", "Correct? (tick / write)"], [1400, 3200, 1800, 2200]),
          dataRow(["24NS1117", "Teej Kundan Gold Necklace Set", "Gold Plated", "☐ Yes   /   ___________"], [{ bold: true }], LGRAY),
          dataRow(["24NS1140", "Reception Meenakari Necklace Set", "Gold Plated", "☐ Yes   /   ___________"], [{ bold: true }]),
        ]),

        divider(),

        /* ══════════════════════ 2. LOW STOCK ════════════════════════════ */
        h2("2. Low Stock — Write New Stock Counts  (FILL IN)"),
        para("These 8 products have only 2 units left. Write the new stock number (or 0 for out of stock):"),
        spacer(),
        makeTable([
          headerRow(["SKU", "Product Name", "Now", "New Stock"], [1700, 4100, 800, 2000]),
          ...[
            ["10BG859-M", "Karva Chauth Pearl Bangles"],
            ["10FR392-Ruby", "Karva Chauth Polki Cocktail Ring"],
            ["10FR393", "Teej Kundan Ring"],
            ["10NS20", "Dulhan Kundan Layered Set"],
            ["10NS809", "Navratri Kundan Necklace Set"],
            ["10PS186", "Bridal Kundan Haar Set"],
            ["30NS08", "Bridal Kundan Choker Set"],
            ["30NS803-White", "Vivaah Polki Pendant Set"],
          ].map((r, i) =>
            dataRow([r[0], r[1], "2", "_________"], [{ bold: true }, {}, { color: RED, bold: true }, { italic: true, color: "888888" }], i % 2 === 0 ? LGRAY : WHITE)
          ),
        ]),

        divider(),

        /* ══════════════════════ 3. SSL ══════════════════════════════════ */
        h2("3. www SSL Fix — iPhone 'Not Private' Warning  (DO — 5 min, HIGH)"),
        bullet("Open vercel.com → sirini-website → Settings → Domains"),
        bullet('Click "Add Domain" → type:  www.sirinijewellery.com → Add'),
        bullet("Vercel shows a CNAME value (usually cname.vercel-dns.com)"),
        bullet("At your domain registrar → DNS → add CNAME:  Name = www  |  Value = cname.vercel-dns.com"),
        bullet("Wait 1–5 min → SSL auto-issues → warning gone on all devices"),

        divider(),

        /* ══════════════════════ 4. RESEND ═══════════════════════════════ */
        h2("4. Turn On Order Emails  (DO)"),
        bullet("Create free account at resend.com"),
        bullet("Resend → Domains → Add sirinijewellery.com → add the 3 DNS records it shows at your registrar → Verify"),
        bullet("Resend → API Keys → copy the key"),
        bullet("Vercel → sirini-website → Settings → Environment Variables → add  RESEND_API_KEY = (key)"),
        bullet("Also add  ORDER_FROM_EMAIL = orders@sirinijewellery.com  (after domain verifies)"),
        bullet("Redeploy → you get an email for every order + a daily 9 AM digest"),

        divider(),

        /* ══════════════════════ 5. RAZORPAY WEBHOOK ════════════════════ */
        h2("5. Razorpay Webhook  (DO)"),
        bullet("Razorpay Dashboard → Settings → Webhooks → + Add New Webhook"),
        bullet("URL:  https://sirinijewellery.com/api/webhooks/razorpay"),
        bullet("Events:  payment.captured  +  payment.failed"),
        bullet("Create a strong secret → copy it"),
        bullet("Vercel env vars → add  RAZORPAY_WEBHOOK_SECRET = (secret) → redeploy"),

        divider(),

        /* ══════════════════════ 6. CRON SECRET ═════════════════════════ */
        h2("6. Protect the Daily Digest  (DO — optional, 2 min)"),
        bullet("Vercel env vars → add  CRON_SECRET = (any long random string, 32+ chars) → redeploy"),

        divider(),

        /* ══════════════════════ 7. DECISIONS ═══════════════════════════ */
        h2("7. Decisions Needed  (FILL IN)"),
        spacer(),

        h3("a) TEST1 coupon (₹10,000 flat, exhausted but visible)", BLUE),
        inputLine("Action", "☐ Delete    ☐ Keep    ☐ Reset usage"),
        spacer(),

        h3("b) Stray personal files in the code repository", BLUE),
        para("ABoutUSPage.png, Logo.jpeg, logo_proper.jpeg, IMPROVEMENTS.MD, marketing.txt", { italic: true, color: "666666" }),
        inputLine("Action", "☐ Delete all    ☐ Keep: ______________"),
        spacer(),

        h3("c) NEW — Customer reviews have no approval step", BLUE),
        para("Right now anyone can post a review without logging in and it appears on the product page instantly (spam/abuse risk). Recommended: I build an admin Reviews page and new reviews stay hidden until you approve them."),
        inputLine("Action", "☐ Build approval flow    ☐ Leave as-is"),
        spacer(),

        h3("d) NEW — No rate limiting on forms", BLUE),
        para("Register/login/contact/reviews can be hit by bots without limit. Fix needs a free Upstash account connected to Vercel (I'll do the code)."),
        inputLine("Action", "☐ Set up Upstash + tell Claude    ☐ Later"),
        spacer(),

        h3("e) NEW — Cancelled paid orders don't flag the refund", BLUE),
        para("If a customer cancels an order they already paid online, stock is restored but nothing reminds you to refund in Razorpay. I can add a refund-owed marker + admin alert."),
        inputLine("Action", "☐ Add refund marker    ☐ Not needed"),
        spacer(),

        h3("f) NEW — Premium-item discounts look small", BLUE),
        para("With the ₹1,500–6,000 gap rule, expensive pieces show small discounts (e.g. ₹19,900 necklace struck at ₹21,499 = 7% off). If you want bigger discounts on premium items, tell me a rule — e.g. \"minimum 25% off everywhere\"."),
        inputLine("Action", "☐ Fine as-is    ☐ Rule: ______________"),

        divider(),

        /* ══════════════════════ CHECKLIST ══════════════════════════════ */
        h2("Quick Checklist"),
        spacer(),
        makeTable([
          headerRow(["#", "Task", "Type", "Priority"], [500, 5800, 1300, 1000]),
          ...[
            ["1", "Confirm material for 24NS1117 & 24NS1140 (Section 1)", "Fill in", "🟡"],
            ["2", "Write new stock counts for 8 low-stock products (Section 2)", "Fill in", "🟡"],
            ["3", "Add www.sirinijewellery.com to Vercel domains (Section 3)", "Do", "🔴"],
            ["4", "Resend account + RESEND_API_KEY in Vercel (Section 4)", "Do", "🟡"],
            ["5", "Razorpay webhook + secret in Vercel (Section 5)", "Do", "🟡"],
            ["6", "CRON_SECRET in Vercel (Section 6)", "Do", "🟢"],
            ["7", "TEST1 coupon decision (7a)", "Decide", "🟢"],
            ["8", "Stray files decision (7b)", "Decide", "🟢"],
            ["9", "Review approval flow — yes/no (7c)", "Decide", "🟡"],
            ["10", "Rate limiting via Upstash — yes/later (7d)", "Decide", "🟡"],
            ["11", "Refund-owed marker — yes/no (7e)", "Decide", "🟡"],
            ["12", "Premium discount rule — fine/change (7f)", "Decide", "🟢"],
          ].map((r, i) =>
            dataRow(r, [{ bold: true }, {}, {}, {}], i % 2 === 0 ? LGRAY : WHITE)
          ),
        ]),

        spacer(2),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Fill in the blanks, tick the boxes, send it back — Claude handles the rest.", size: 18, italic: true, color: "888888" })],
        }),
        spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "sirinijewellery.com  •  sirinijewellery@gmail.com", size: 16, color: GOLD })],
        }),
      ],
    },
  ],
});

/* ── Write file ──────────────────────────────────────────────────────────── */
const outPath = path.join("D:\\", "Owner", "Desktop", "Sirini Pending Tasks.docx");
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log("✓ Saved:", outPath);
});
