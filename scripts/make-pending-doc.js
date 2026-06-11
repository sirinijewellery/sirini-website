/**
 * make-pending-doc.js
 * Generates a Word document (.docx) of all pending tasks for Sirini Jewellery.
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
const CREAM   = "FFF8F0";
const LGRAY   = "F5F5F5";
const MGRAY   = "CCCCCC";
const RED     = "C0392B";
const AMBER   = "E67E22";
const GREEN   = "27AE60";
const BLUE    = "2980B9";
const WHITE   = "FFFFFF";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: MAROON })],
  });
}

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
      new TextRun({ text: defaultText || "____________________________", size: 18, underline: { type: UnderlineType.SINGLE, color: MGRAY } }),
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
    shading: shade ? { fill: bg, type: ShadingType.SOLID, color: bg } : { fill: bg, type: ShadingType.CLEAR },
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

function priceInputRow(sku, name, note = "") {
  return new TableRow({
    children: [
      cell(sku, { bold: true, size: 18 }),
      cell(name, { size: 18 }),
      cell("₹ ___________", { size: 18, italic: true, color: "888888" }),
      cell("₹ ___________", { size: 18, italic: true, color: "888888" }),
      cell(note, { size: 16, italic: true, color: RED }),
    ],
  });
}

function makeTable(rows, widths = []) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

/* ──────────────────────── section divider ────────────────────────────── */
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
      document: {
        run: { font: "Calibri", size: 18, color: "1A1A1A" },
      },
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
          children: [new TextRun({ text: "Pending Tasks & Product Price Sheet", size: 28, color: GOLD })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
          children: [new TextRun({ text: "Generated: 10 June 2026  •  sirinijewellery.com", size: 18, color: "888888" })],
        }),
        divider(),

        /* ══════════════════════ 1. PRODUCT PRICES ═══════════════════════ */
        h2("1. Products Needing Real Prices"),
        para(
          "The 8 products below have a placeholder price of ₹999 in the database. " +
          "Please fill in the correct Selling Price and Compare-At Price (MRP) for each and update them in the admin panel.",
          { color: "444444" }
        ),
        spacer(),

        makeTable([
          headerRow(
            ["SKU", "Product Name", "Selling Price (₹)", "Compare-At / MRP (₹)", "Notes"],
            [1400, 3000, 1800, 1800, 2600]
          ),
          priceInputRow("10NS517", "Vivaah Polki Gold Necklace Set"),
          priceInputRow("10NS672", "Dulhan Meenakari Necklace Set"),
          priceInputRow("10NS686", "Bridal Polki Choker Set"),
          priceInputRow("10NS697", "Sangeet Temple Necklace Set"),
          priceInputRow("10NS712", "Reception Kundan Necklace Set"),
          priceInputRow("10NS723", "Puja Antique Kundan Necklace Set"),
          priceInputRow("24NS1117", "Teej Kundan Gold Necklace Set", "Verify: Gold Plated?"),
          priceInputRow("24NS1140", "Reception Meenakari Necklace Set", "Verify: Gold Plated?"),
        ]),
        spacer(),
        para("How to update: Admin Panel → Products → search SKU → edit price fields → Save.", { italic: true, color: "666666" }),

        divider(),

        /* ══════════════════════ 2. MATERIAL / CATEGORY DOUBTS ══════════ */
        h2("2. Product Details to Verify"),
        para("These products were uploaded with auto-detected material. Please confirm they are correct:"),
        spacer(),

        makeTable([
          headerRow(["SKU", "Product Name", "Auto-Detected Material", "Correct? (tick or write)"], [1400, 3200, 2000, 2000]),
          dataRow(["24NS1117", "Teej Kundan Gold Necklace Set", "Gold Plated", "✓  /  ___________"], [{bold:true}], LGRAY),
          dataRow(["24NS1140", "Reception Meenakari Necklace Set", "Gold Plated", "✓  /  ___________"], [{bold:true}]),
        ]),
        spacer(),
        para("If material is wrong: Admin Panel → Products → search SKU → edit Material field → Save.", { italic: true, color: "666666" }),

        divider(),

        /* ══════════════════════ 3. LOW STOCK ════════════════════════════ */
        h2("3. Low Stock (≤ 2 Units Remaining)"),
        para("These products are almost sold out. Update stock counts or mark as out of stock if needed:"),
        spacer(),

        makeTable([
          headerRow(["SKU", "Product Name", "Current Stock", "Action"], [1400, 3200, 1500, 2500]),
          ...[
            ["10BG859-M", "Karva Chauth Pearl Bangles",     "2"],
            ["10FR392-Ruby", "Karva Chauth Polki Cocktail Ring", "2"],
            ["10FR393",   "Teej Kundan Ring",                "2"],
            ["10NS20",    "Dulhan Kundan Layered Set",        "2"],
            ["10NS809",   "Navratri Kundan Necklace Set",     "2"],
            ["10PS186",   "Bridal Kundan Haar Set",           "2"],
            ["30NS08",    "Bridal Kundan Choker Set",         "2"],
            ["30NS803-White", "Vivaah Polki Pendant Set",    "2"],
          ].map((r, i) =>
            dataRow(
              [r[0], r[1], r[2], "Restock  /  Mark OOS"],
              [{bold:true},{},{color:RED, bold:true},{}],
              i % 2 === 0 ? LGRAY : WHITE
            )
          ),
        ]),

        divider(),

        /* ══════════════════════ 4. SSL / DOMAIN ════════════════════════ */
        h2("4. www SSL Fix (iPhone Shows 'Not Private' Warning)"),
        para("Root cause: www.sirinijewellery.com is not registered in the Vercel project, so it has no SSL certificate."),
        spacer(),
        h3("Steps to fix (5 minutes):", BLUE),
        bullet("Open vercel.com → sirini-website → Settings → Domains"),
        bullet('Click "Add Domain" → type:  www.sirinijewellery.com → Add'),
        bullet("Vercel shows a CNAME record value (usually cname.vercel-dns.com)"),
        bullet("Go to your domain registrar (GoDaddy / Namecheap etc.) → DNS settings"),
        bullet('Add a CNAME record:  Name = www  |  Value = cname.vercel-dns.com'),
        bullet("Wait 1–5 min → Vercel auto-issues SSL certificate → iPhone warning gone"),
        spacer(),
        para("After this, both sirinijewellery.com and www.sirinijewellery.com will work on all devices.", { italic: true }),

        divider(),

        /* ══════════════════════ 5. EMAIL / NOTIFICATIONS ════════════════ */
        h2("5. Order Email Notifications (Currently Off)"),
        para("All the code for order emails is ready. It just needs an API key to activate:"),
        spacer(),
        makeTable([
          headerRow(["Step", "What to Do", "Where"], [600, 5000, 3000]),
          dataRow(["1", "Create a free account at resend.com (email service)", "resend.com"], [{bold:true}], LGRAY),
          dataRow(["2", 'Add your domain sirinijewellery.com in Resend → "Domains" tab and verify DNS', "Resend dashboard"], [{bold:true}]),
          dataRow(["3", 'Copy the API key from Resend → "API Keys"', "Resend dashboard"], [{bold:true}], LGRAY),
          dataRow(["4", "Go to Vercel → sirini-website → Settings → Environment Variables", "vercel.com"], [{bold:true}]),
          dataRow(["5", "Add:  RESEND_API_KEY  =  (paste key here)", "Vercel env vars"], [{bold:true}], LGRAY),
          dataRow(["6", "Redeploy — emails will start sending automatically", "Vercel dashboard"], [{bold:true}]),
        ]),
        spacer(),
        para("Emails sent: (a) New order notification to sirinijewellery@gmail.com   (b) Daily revenue digest at 9:00 AM IST.", { italic: true }),

        divider(),

        /* ══════════════════════ 6. RAZORPAY WEBHOOK ════════════════════ */
        h2("6. Razorpay Webhook Setup"),
        para("The webhook verifies real-time payment confirmations. Without it, some edge-case payments may not auto-confirm."),
        spacer(),
        makeTable([
          headerRow(["Step", "What to Do"], [600, 8000]),
          dataRow(["1", "Login to Razorpay Dashboard → Settings → Webhooks → + Add New Webhook"], [{bold:true}], LGRAY),
          dataRow(["2", "Webhook URL:  https://sirinijewellery.com/api/webhooks/razorpay"], [{bold:true}]),
          dataRow(["3", "Events to select:  payment.captured  +  payment.failed"], [{bold:true}], LGRAY),
          dataRow(["4", "Copy the 'Secret' shown (create a strong one)"], [{bold:true}]),
          dataRow(["5", "In Vercel env vars add:  RAZORPAY_WEBHOOK_SECRET  =  (paste secret)"], [{bold:true}], LGRAY),
          dataRow(["6", "Redeploy — webhook is now active"], [{bold:true}]),
        ]),

        divider(),

        /* ══════════════════════ 7. CRON SECRET ════════════════════════ */
        h2("7. Secure the Daily Digest Cron Job (Optional but Recommended)"),
        para("The daily digest runs at 9:00 AM IST. Adding a secret prevents anyone else from triggering it:"),
        spacer(),
        bullet("Go to Vercel → sirini-website → Settings → Environment Variables"),
        bullet("Add:  CRON_SECRET  =  (any long random string, e.g. 32+ characters)"),
        bullet("Redeploy — cron endpoint is now protected"),

        divider(),

        /* ══════════════════════ 8. COUPON CLEANUP ══════════════════════ */
        h2("8. TEST1 Coupon — Decide Action"),
        para("There is a coupon code TEST1 (₹10,000 flat discount) that was used once internally. It is exhausted but still visible:"),
        spacer(),
        inputLine("Action", "Delete  /  Keep for internal use  /  Reset usage"),
        spacer(),
        para("To delete: Admin Panel → Coupons → TEST1 → Delete.", { italic: true, color: "666666" }),

        divider(),

        /* ══════════════════════ 9. STRAY FILES ════════════════════════ */
        h2("9. Stray Files in GitHub Repository"),
        para("These personal files were accidentally committed to the website's code repository:"),
        spacer(),
        makeTable([
          headerRow(["Filename", "Action Needed"], [3000, 5600]),
          dataRow(["ABoutUSPage.png",  "Delete from repo (or keep if you want to use it on the About page)"], [{bold:true}], LGRAY),
          dataRow(["Logo.jpeg",        "Delete — superseded by proper logo files already in use"],          [{bold:true}]),
          dataRow(["logo_proper.jpeg", "Delete — superseded by proper logo files already in use"],          [{bold:true}], LGRAY),
          dataRow(["IMPROVEMENTS.MD",  "Delete — internal notes document"],                                  [{bold:true}]),
          dataRow(["marketing.txt",    "Delete — internal marketing notes"],                                 [{bold:true}], LGRAY),
        ]),
        spacer(),
        para("Just say 'delete the stray files' and I will remove them from the repository.", { italic: true, color: "666666" }),

        divider(),

        /* ══════════════════════ 10. RESEND DOMAIN ══════════════════════ */
        h2("10. Resend Domain Verification (Before Emails Go Live)"),
        para(
          "Currently order emails would come from onboarding@resend.dev (Resend's test address). " +
          "To send from orders@sirinijewellery.com you must verify your domain in Resend:"
        ),
        spacer(),
        bullet("Login to resend.com → Domains → Add Domain → enter sirinijewellery.com"),
        bullet("Resend will show 3 DNS records to add (TXT + CNAME type)"),
        bullet("Add these records at your domain registrar"),
        bullet("Come back to Resend → click Verify — domain status turns green"),
        bullet("Then set Vercel env var:  ORDER_FROM_EMAIL  =  orders@sirinijewellery.com"),
        spacer(),
        para("Until this is done, emails still work but come from Resend's generic address.", { italic: true }),

        divider(),

        /* ══════════════════════ SUMMARY CHECKLIST ══════════════════════ */
        h2("Quick Checklist"),
        spacer(),

        makeTable([
          headerRow(["#", "Task", "Priority", "Done?"], [400, 5600, 1400, 1200]),
          ...[
            ["1",  "Set real prices for 8 ₹999 products (Section 1)",              "🔴 High",   "☐"],
            ["2",  "Verify material for 24NS1117 & 24NS1140 (Section 2)",           "🟡 Medium", "☐"],
            ["3",  "Restock / mark OOS the 8 low-stock products (Section 3)",       "🟡 Medium", "☐"],
            ["4",  "Fix www SSL — add www to Vercel domains (Section 4)",            "🔴 High",   "☐"],
            ["5",  "Set up Resend + add RESEND_API_KEY to Vercel (Section 5)",      "🟡 Medium", "☐"],
            ["6",  "Set up Razorpay webhook + RAZORPAY_WEBHOOK_SECRET (Section 6)", "🟡 Medium", "☐"],
            ["7",  "Add CRON_SECRET to Vercel (Section 7)",                         "🟢 Low",    "☐"],
            ["8",  "Decide on TEST1 coupon (Section 8)",                            "🟢 Low",    "☐"],
            ["9",  "Remove stray files from repo (Section 9)",                      "🟢 Low",    "☐"],
            ["10", "Verify domain in Resend for production emails (Section 10)",    "🟡 Medium", "☐"],
          ].map((r, i) =>
            dataRow([r[0], r[1], r[2], r[3]], [{bold:true},{},{},{}], i % 2 === 0 ? LGRAY : WHITE)
          ),
        ]),

        spacer(2),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "— End of Document —", size: 18, italic: true, color: "AAAAAA" })],
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
