"use client";

import { useEffect } from "react";

/**
 * Reveals `.reveal` elements on scroll by adding `.active`.
 *
 * Robust against:
 *  - Suspense / streamed content (ProductGrid on /shop arrives AFTER first paint)
 *  - Client-side route changes (new `.reveal` nodes added to the DOM)
 *  - Observer never firing (safety net force-reveals near-viewport content)
 *
 * Mounted once in the root layout so EVERY page (incl. /shop) is covered.
 * Without this, `.stagger-grid > *` stays at opacity:0 and products are invisible.
 */
export function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const seen = new WeakSet<Element>();

    const scan = () => {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
        if (seen.has(el) || el.classList.contains("active")) return;
        seen.add(el);
        io.observe(el);
      });
    };

    scan();

    // Catch content that streams in later (Suspense boundaries, route changes).
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net — never leave content invisible. For a few seconds after mount,
    // force-reveal anything still hidden that sits at/near the viewport.
    const safety = window.setInterval(() => {
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.active)")
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 1.25 && rect.bottom > 0) {
            el.classList.add("active");
            io.unobserve(el);
          }
        });
    }, 350);
    const stopSafety = window.setTimeout(
      () => window.clearInterval(safety),
      5000
    );

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearInterval(safety);
      window.clearTimeout(stopSafety);
    };
  }, []);

  return null;
}
