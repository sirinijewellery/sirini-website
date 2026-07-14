import Image from "next/image";

// Route-level branded loader — shown while a segment's data is fetched.
// Stays invisible for the first 300ms (`.loader-fade-in`) so fast/cached
// navigations never flash it; only genuinely slow loads reveal it.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loader-fade-in flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-background px-6"
    >
      <div className="loader-breathe">
        <Image
          src="https://res.cloudinary.com/dp8a2lvxg/image/upload/e_trim,e_make_transparent:20,f_png,w_400/sirini-jewellery/logo-real.png"
          alt="Sirini Jewellery"
          width={500}
          height={500}
          className="h-20 w-auto object-contain"
          preload
        />
      </div>
      <div className="loader-line h-px w-24" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
