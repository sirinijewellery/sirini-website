// Searchable how-to content for the admin Help tab. Each topic maps an admin
// task to step-by-step instructions. Keep steps short and action-oriented and
// refer to the sidebar labels the owner actually sees.

export interface HelpTopic {
  id: string;
  group: string;
  title: string;
  keywords: string; // extra search terms not already in title/steps
  steps: string[];
}

export const HELP_TOPICS: HelpTopic[] = [
  // ── Products ──────────────────────────────────────────────────────────────
  {
    id: "add-product",
    group: "Products",
    title: "How to add a new product",
    keywords: "create item upload new listing add product jewellery",
    steps: [
      "In the sidebar, click Products, then click 'Add Product' (top right).",
      "Enter the Product Name — the URL slug fills in automatically.",
      "Type the SKU, then click the 'Auto' button to auto-detect the category from the SKU code.",
      "Under Categories, tick one OR MORE categories the product belongs to.",
      "Choose the Material and enter the Price. Optionally add a 'Compare-at price' to show a struck-through original price.",
      "Set the Stock quantity (use 0 for out of stock).",
      "Upload images by clicking the upload box or dragging files in. The FIRST image is the cover.",
      "Optional: pick a Badge, tick Occasions, toggle 'Featured' to show it on the home page, and set a 'Front-page position' to pin it.",
      "Click Save. The product is live immediately.",
    ],
  },
  {
    id: "edit-delete-product",
    group: "Products",
    title: "How to edit or delete a product",
    keywords: "change update remove product price name",
    steps: [
      "Click Products in the sidebar.",
      "Find the product (use the search box at the top of the list).",
      "Click the product (or its Edit action) to open the edit form.",
      "Change any field and click Save.",
      "To delete it, open the product and use the Delete button, then confirm.",
    ],
  },
  {
    id: "product-multiple-categories",
    group: "Products",
    title: "How to put a product in multiple categories",
    keywords: "multi category several categories tags add to category",
    steps: [
      "Open the product (Products → Add Product, or edit an existing one).",
      "In the Categories field, tick every category it should appear under — you can select more than one.",
      "The first ticked category is treated as its main category.",
      "Click Save. The product now shows under each chosen category in the shop.",
    ],
  },
  {
    id: "product-cover-image",
    group: "Products",
    title: "How to add product images or change the cover",
    keywords: "photos picture cover image upload reorder gallery",
    steps: [
      "Open the product's edit form.",
      "In the Images section, click the upload box or drag image files in (max 5 MB each).",
      "The first image in the row is the cover shown on cards.",
      "Hover an image and click its 'Cover' button to make it the cover, or the ✕ to remove it.",
      "Click Save.",
    ],
  },
  {
    id: "feature-product",
    group: "Products",
    title: "How to feature a product on the home page",
    keywords: "homepage featured highlight front page show on home",
    steps: [
      "Open the product's edit form.",
      "Toggle the 'Featured' switch on.",
      "Click Save — it will appear in the Featured section on the home page.",
    ],
  },
  {
    id: "product-frontpage-position",
    group: "Products",
    title: "How to control a product's position on the shop's first page",
    keywords: "order sort pin first page display order arrange",
    steps: [
      "Open the product's edit form.",
      "Set the 'Front-page position' number (1 = first). Pinned products always come before unpinned ones.",
      "Leave it blank to un-pin the product.",
      "Click Save.",
    ],
  },
  {
    id: "product-stock",
    group: "Products",
    title: "How to mark a product out of stock or change stock",
    keywords: "inventory sold out out of stock quantity availability",
    steps: [
      "Open the product's edit form.",
      "Change the Stock number. Set it to 0 to mark the product Out of Stock.",
      "Click Save.",
    ],
  },
  {
    id: "product-sale-price",
    group: "Products",
    title: "How to set a sale / struck-through price",
    keywords: "discount mrp original price strikethrough offer compare at",
    steps: [
      "Open the product's edit form.",
      "Enter the selling Price in the Price field.",
      "Enter the higher original price in 'Compare-at price' — it shows struck through next to the price.",
      "Click Save.",
    ],
  },

  // ── Categories ──────────────────────────────────────────────────────────
  {
    id: "add-category",
    group: "Categories",
    title: "How to add a category",
    keywords: "create new category collection section",
    steps: [
      "Click Categories in the sidebar.",
      "Click the 'Add Category' button (top right).",
      "Type the Name (e.g. Rings) — the Slug fills in automatically (keep it lowercase-with-hyphens).",
      "Paste an Image URL for the category card (a Cloudinary image URL works well). This is needed for it to show as a home-page card.",
      "Click Save.",
    ],
  },
  {
    id: "edit-delete-category",
    group: "Categories",
    title: "How to edit or delete a category / change its image",
    keywords: "rename category image remove delete update",
    steps: [
      "Click Categories in the sidebar.",
      "Click 'Edit' on the category row to change its name, slug, or image URL, then click Save.",
      "Click 'Delete' to remove it (products keep their category tag but the card disappears).",
    ],
  },

  // ── Coupons ───────────────────────────────────────────────────────────────
  {
    id: "add-coupon",
    group: "Coupons",
    title: "How to add a coupon / discount code",
    keywords: "promo code voucher discount offer create coupon",
    steps: [
      "Click Coupons in the sidebar, then 'Add Coupon' / 'New Coupon'.",
      "Enter the Code (e.g. DIWALI10) — it's automatically uppercased.",
      "Choose the type: Percentage (e.g. 10 = 10% off) or Flat (a fixed ₹ amount off).",
      "Enter the discount Value.",
      "Optional: set a Minimum order amount, a Max uses limit, and an Expiry date.",
      "Make sure 'Active' is on, then Save. Customers can now apply the code at checkout.",
    ],
  },
  {
    id: "edit-coupon",
    group: "Coupons",
    title: "How to edit, deactivate or delete a coupon",
    keywords: "turn off disable expire remove coupon edit",
    steps: [
      "Click Coupons in the sidebar.",
      "Edit a coupon to change its value, limits or expiry, then Save.",
      "Switch 'Active' off to stop it working without deleting it, or use Delete to remove it.",
    ],
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  {
    id: "manage-orders",
    group: "Orders",
    title: "How to view orders and update an order's status",
    keywords: "order shipped delivered processing cancel status fulfil",
    steps: [
      "Click Orders in the sidebar to see all orders.",
      "Click an order to open its full details (items, customer, address).",
      "Use the status dropdown to move it through Processing → Shipped → Delivered, or Cancelled.",
      "The change saves immediately.",
    ],
  },

  // ── Home page ─────────────────────────────────────────────────────────────
  {
    id: "change-hero",
    group: "Home page",
    title: "How to change the hero image(s) at the top of the home page",
    keywords: "banner hero main image slideshow slides homepage top picture",
    steps: [
      "Click 'Hero Section' in the sidebar.",
      "Under 'Add a hero image', click to upload a new slide.",
      "Add more than one image to create a rotating slideshow.",
      "Set the 'Rotation speed' (seconds each slide stays) and click Save.",
      "Use the arrows to reorder, the eye icon to hide/show, or the bin to delete a slide.",
    ],
  },
  {
    id: "hero-crop-devices",
    group: "Home page",
    title: "How to crop the hero image differently for mobile and desktop",
    keywords: "focal point crop mobile desktop framing position hero",
    steps: [
      "Click 'Hero Section' in the sidebar and find your slide.",
      "Click anywhere on the Desktop preview to set the focus point for computers.",
      "Click anywhere on the Mobile preview to set a separate focus point for phones.",
      "Optionally click 'Use a different image on mobile' to upload a phone-specific photo.",
      "Changes save automatically.",
    ],
  },
  {
    id: "edit-ribbon",
    group: "Home page",
    title: "How to edit the announcement ribbon messages",
    keywords: "top bar banner announcement strip message ribbon scrolling",
    steps: [
      "Click 'Header Ribbon' in the sidebar.",
      "Edit any message, click 'Add message' for more, or the bin to remove one.",
      "Click 'Save changes' — the rotating bar at the very top of the site updates.",
    ],
  },

  // ── Admins & account ──────────────────────────────────────────────────────
  {
    id: "add-admin",
    group: "Admins",
    title: "How to add another admin",
    keywords: "new admin user staff access account create login",
    steps: [
      "Click Admins in the sidebar.",
      "Under 'Add a new admin', enter a Username, an optional display name, and a Password.",
      "Click 'Create admin'. They can now sign in with that username (case-insensitive).",
    ],
  },
  {
    id: "change-admin-credentials",
    group: "Admins",
    title: "How to change another admin's username or password",
    keywords: "reset password rename admin edit credentials",
    steps: [
      "Click Admins in the sidebar.",
      "Click the pencil (Edit) next to the admin.",
      "Change the Username and/or type a new Password, then click Save.",
      "You can't delete yourself or the last remaining admin.",
    ],
  },
  {
    id: "change-own-account",
    group: "My account",
    title: "How to change your own username or password",
    keywords: "my account change my password rename myself login details",
    steps: [
      "Click 'My Account' in the sidebar.",
      "Update your Username, display name, or set a New password.",
      "Enter your Current password at the bottom (required to save any change).",
      "Click 'Save changes'. Use the new details next time you sign in.",
    ],
  },
];
