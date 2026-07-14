import Image from "next/image";
import { siteConfig } from "@/lib/seo";

// Shared branded loading mark — breathing Sirini logo over a sweeping gold
// line. Used by the route loading boundaries (app/loading.tsx) and the
// first-load splash (app/layout.tsx) so the markup and motion can't drift
// between copies. The wrapper decides visibility timing (loader-fade-in /
// splash-fade-in) and accessibility semantics; this renders only the mark.
export function BrandedLoader() {
  return (
    <>
      <div className="loader-breathe">
        <Image
          src={siteConfig.logo}
          alt=""
          width={500}
          height={500}
          className="h-20 w-auto object-contain"
          preload
        />
      </div>
      <div className="loader-line h-px w-24" aria-hidden="true" />
    </>
  );
}
