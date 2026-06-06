// Festive sale banner configuration.
//
// Owner-editable: change these values to control the countdown banner that
// appears at the very top of every page. Flip `enabled` to false to hide it
// entirely, or update `endsAt` to start a fresh sale (changing `endsAt` also
// re-shows the banner for users who previously dismissed an older sale).
//
// Client-safe: no imports, plain data only.
export const SALE = {
  enabled: true,
  label: "Festive Sale",
  message: "Up to 50% off — Festive Edit",
  code: "FESTIVE10", // optional coupon to show; set to "" to hide
  endsAt: "2026-06-30T23:59:59+05:30", // IST end time (ISO-8601 with offset)
} as const;
