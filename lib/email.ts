import { Resend } from "resend";

interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  // TODO: Wire up email provider (Resend or Nodemailer) when decided
  // For now, logs to console in development
  console.log("[Contact Form Submission]", {
    to: process.env.CONTACT_EMAIL,
    from: data.email,
    name: data.name,
    message: data.message,
    timestamp: new Date().toISOString(),
  });
}

/* ── New-order admin notification ───────────────────────────────────────── */

export interface NewOrderEmailPayload {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    label?: string;
  } | null;
  items: { name: string; quantity: number }[];
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderAddress(address: NewOrderEmailPayload["shippingAddress"]): string {
  if (!address) return "—";
  const parts = [
    address.line1,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  const line = parts.join(", ");
  return escapeHtml(line || "—");
}

/**
 * Sends an admin notification email when a new order is placed.
 *
 * Designed to NEVER block or break order creation:
 *  - If RESEND_API_KEY is missing it warns and returns silently.
 *  - The whole body is wrapped in try/catch; errors are logged, never thrown.
 */
export async function sendNewOrderEmails(
  order: NewOrderEmailPayload
): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[email] RESEND_API_KEY not set — skipping new-order notification email."
      );
      return;
    }

    const resend = new Resend(apiKey);

    const adminTo = process.env.ADMIN_ORDER_EMAIL ?? "sirinijewellery@gmail.com";
    const from =
      process.env.ORDER_FROM_EMAIL ??
      "Sirini Jewellery <onboarding@resend.dev>";

    const orderRef = `SR${order.orderNumber}`;
    const subject = `New order ${orderRef} — ${formatINR(order.totalAmount)}`;

    const itemRows = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(
              item.name
            )}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;">× ${
              item.quantity
            }</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;">
        <h2 style="color:#5C1A24;margin-bottom:4px;">New order ${escapeHtml(
          orderRef
        )}</h2>
        <p style="margin-top:0;color:#666;">A new order has just been placed on Sirini Jewellery.</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:4px 0;color:#666;">Order</td>
            <td style="padding:4px 0;text-align:right;font-weight:bold;">${escapeHtml(
              orderRef
            )}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#666;">Customer</td>
            <td style="padding:4px 0;text-align:right;">${escapeHtml(
              order.customerName
            )}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#666;">Phone</td>
            <td style="padding:4px 0;text-align:right;">${escapeHtml(
              order.customerPhone
            )}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#666;">Email</td>
            <td style="padding:4px 0;text-align:right;">${escapeHtml(
              order.customerEmail
            )}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#666;">Payment</td>
            <td style="padding:4px 0;text-align:right;text-transform:uppercase;">${escapeHtml(
              order.paymentMethod
            )}</td>
          </tr>
        </table>

        <h3 style="color:#5C1A24;margin-bottom:8px;">Items</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${itemRows}
          <tr>
            <td style="padding:10px 12px;font-weight:bold;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;">${escapeHtml(
              formatINR(order.totalAmount)
            )}</td>
          </tr>
        </table>

        <h3 style="color:#5C1A24;margin-bottom:4px;">Shipping address</h3>
        <p style="margin-top:0;color:#444;">${renderAddress(
          order.shippingAddress
        )}</p>
      </div>
    `;

    await resend.emails.send({
      from,
      to: adminTo,
      subject,
      html,
    });
  } catch (err) {
    // Never throw — email failure must not break order creation.
    console.error("[email] Failed to send new-order notification:", err);
  }
}

/* ── Daily revenue digest ───────────────────────────────────────────────── */

export interface DailyDigestPayload {
  /** Window covered, for the email header (e.g. "9 Jun 2026"). */
  dateLabel: string;
  orderCount: number;
  revenue: number;
  paidRevenue: number;
  codRevenue: number;
  topOrders: { orderNumber: number; customerName: string; totalAmount: number; paymentMethod: string }[];
}

/**
 * Sends the owner a once-a-day summary of the previous 24h of orders.
 * Same dormant-safe contract as sendNewOrderEmails: no RESEND_API_KEY → warn
 * and return; all errors caught, never thrown.
 */
export async function sendDailyDigestEmail(data: DailyDigestPayload): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY not set — skipping daily digest email.");
      return;
    }

    const resend = new Resend(apiKey);
    const adminTo = process.env.ADMIN_ORDER_EMAIL ?? "sirinijewellery@gmail.com";
    const from = process.env.ORDER_FROM_EMAIL ?? "Sirini Jewellery <onboarding@resend.dev>";

    const subject = `Sirini daily digest — ${data.orderCount} order${
      data.orderCount === 1 ? "" : "s"
    }, ${formatINR(data.revenue)} (${data.dateLabel})`;

    const orderRows =
      data.topOrders.length === 0
        ? `<tr><td colspan="3" style="padding:10px 12px;color:#888;">No orders in this period.</td></tr>`
        : data.topOrders
            .map(
              (o) =>
                `<tr>
                  <td style="padding:6px 12px;border-bottom:1px solid #eee;">SR${o.orderNumber}</td>
                  <td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(
                    o.customerName
                  )} <span style="color:#999;text-transform:uppercase;font-size:11px;">(${escapeHtml(
                  o.paymentMethod
                )})</span></td>
                  <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(
                    formatINR(o.totalAmount)
                  )}</td>
                </tr>`
            )
            .join("");

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;">
        <h2 style="color:#5C1A24;margin-bottom:4px;">Daily digest — ${escapeHtml(data.dateLabel)}</h2>
        <p style="margin-top:0;color:#666;">Your last-24-hour orders summary.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:4px 0;color:#666;">Orders</td><td style="padding:4px 0;text-align:right;font-weight:bold;">${
            data.orderCount
          }</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Total revenue</td><td style="padding:4px 0;text-align:right;font-weight:bold;">${escapeHtml(
            formatINR(data.revenue)
          )}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Paid (online)</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
            formatINR(data.paidRevenue)
          )}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">COD (to collect)</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
            formatINR(data.codRevenue)
          )}</td></tr>
        </table>
        <h3 style="color:#5C1A24;margin-bottom:8px;">Orders</h3>
        <table style="width:100%;border-collapse:collapse;">${orderRows}</table>
      </div>
    `;

    await resend.emails.send({ from, to: adminTo, subject, html });
  } catch (err) {
    console.error("[email] Failed to send daily digest:", err);
  }
}
