import { BrandedLoader } from "@/components/BrandedLoader";

// Route-level branded loader — shown while a segment's data is fetched.
// Stays invisible for the first 300ms (`.loader-fade-in`) so fast/cached
// navigations never flash it; only genuinely slow loads reveal it. The
// hide uses `visibility: hidden` (not just opacity) so screen readers get
// the same treatment as sighted users: no "Loading…" announcement on
// navigations that resolve before the loader would appear.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loader-fade-in flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-background px-6"
    >
      <BrandedLoader />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
