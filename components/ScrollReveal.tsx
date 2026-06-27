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

    // ── Scroll parallax ───────────────────────────────────────────────
    // Elements with data-parallax="0.06" drift vertically at that fraction
    // of their distance from the viewport centre. rAF-throttled; disabled
    // entirely for prefers-reduced-motion users.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let parallaxEls: HTMLElement[] = [];
    let raf = 0;

    const collectParallax = () => {
      parallaxEls = Array.from(
        document.querySelectorAll<HTMLElement>("[data-parallax]")
      );
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        for (const el of parallaxEls) {
          const r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) continue;
          const speed = parseFloat(el.dataset.parallax || "0.06");
          const offset = (r.top + r.height / 2 - vh / 2) * -speed;
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        }
      });
    };

    if (!prefersReduced) {
      collectParallax();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      onScroll();
    }

    const scan = () => {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
        if (seen.has(el) || el.classList.contains("active")) return;
        seen.add(el);
        io.observe(el);
      });
      if (!prefersReduced) collectParallax();
    };

    scan();

    // ── Reveal-on-scroll fallback (page lifetime) ─────────────────────
    // The IntersectionObserver can miss elements in some conditions
    // (background/throttled tabs, deep-page content scrolled to after the
    // initial safety window, certain mobile browsers), leaving headings stuck
    // at opacity:0 forever. As a guarantee, reveal anything the user has
    // actually scrolled into view. Adding `.active` still plays the CSS
    // transition, so the entrance animation is preserved. rAF-throttled.
    let revealRaf = 0;
    const revealInView = () => {
      revealRaf = 0;
      const vh = window.innerHeight;
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.active)")
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < vh * 0.95 && rect.bottom > 0) {
            el.classList.add("active");
            io.unobserve(el);
          }
        });
    };
    const onRevealScroll = () => {
      if (revealRaf) return;
      revealRaf = requestAnimationFrame(revealInView);
    };
    window.addEventListener("scroll", onRevealScroll, { passive: true });
    window.addEventListener("resize", onRevealScroll, { passive: true });
    revealInView();

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
      window.removeEventListener("scroll", onRevealScroll);
      window.removeEventListener("resize", onRevealScroll);
      if (revealRaf) cancelAnimationFrame(revealRaf);
      if (!prefersReduced) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (raf) cancelAnimationFrame(raf);
      }
    };
  }, []);

  return null;
}
