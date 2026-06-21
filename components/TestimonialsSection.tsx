"use client";

import { useState, useEffect, useRef } from "react";
import type { FeaturedTestimonial } from "@/lib/queries/home";

// Center-focused carousel matching Stitch HTML exactly.
// Active slide: opacity-100 scale-100, centered via translateX offset.
// Inactive slides: opacity-40 scale-90. Auto-advances every 3478ms.
//
// Items come from the server page: real published reviews when available,
// otherwise the hardcoded fallback array (see getFeaturedTestimonials).

const AUTOPLAY_MS = 3478;
const RESUME_MS = 6000;

export function TestimonialsSection({ items }: { items: FeaturedTestimonial[] }) {
  const testimonials = items;
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Interval/timeout management so manual control and auto-advance don't fight.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  // Mirror of currentIndex for listeners registered once (e.g. resize) so they
  // never read a stale closure value.
  const currentIndexRef = useRef(0);

  function updateCarousel(index: number) {
    const track = trackRef.current;
    if (!track) return;

    const firstSlide = slideRefs.current[0];
    if (!firstSlide) return;

    const slideWidth = firstSlide.offsetWidth;
    const containerWidth = track.parentElement?.offsetWidth ?? 0;
    const offset =
      containerWidth / 2 - slideWidth / 2 - slideWidth * index;

    track.style.transform = `translateX(${offset}px)`;

    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      if (i === index) {
        slide.style.opacity = "1";
        slide.style.transform = "scale(1)";
      } else {
        slide.style.opacity = "0.4";
        slide.style.transform = "scale(0.9)";
      }
    });
  }

  function startAutoplay() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // Pause autoplay on interaction, then schedule a resume after inactivity.
  function pauseThenResume() {
    stopAutoplay();
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      startAutoplay();
    }, RESUME_MS);
  }

  function goTo(index: number) {
    const len = testimonials.length;
    const next = ((index % len) + len) % len; // safe wrap both directions
    setCurrentIndex(next);
  }

  const handlePrev = () => {
    pauseThenResume();
    goTo(currentIndex - 1);
  };

  const handleNext = () => {
    pauseThenResume();
    goTo(currentIndex + 1);
  };

  const handleDotClick = (index: number) => {
    pauseThenResume();
    goTo(index);
  };

  // Hover: pause immediately; resume on leave.
  const handleMouseEnter = () => stopAutoplay();
  const handleMouseLeave = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    startAutoplay();
  };

  // Swipe support for touch devices.
  const handleTouchStart = (e: React.TouchEvent) => {
    stopAutoplay();
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) {
      pauseThenResume();
      return;
    }
    const endX = e.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) {
      goTo(currentIndex - 1);
    } else if (delta < -SWIPE_THRESHOLD) {
      goTo(currentIndex + 1);
    }
    pauseThenResume();
  };

  useEffect(() => {
    // Initial position after layout
    const initTimer = setTimeout(() => updateCarousel(currentIndexRef.current), 50);

    // Auto-advance
    startAutoplay();

    // Resize handler — read from the ref, not the (stale) closure
    const handleResize = () => updateCarousel(currentIndexRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(initTimer);
      stopAutoplay();
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep carousel in sync whenever the index changes (autoplay or manual).
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    updateCarousel(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // The server page always passes a non-empty list (real reviews or the
  // hardcoded fallback), but guard anyway so the carousel never divides by zero.
  if (testimonials.length === 0) return null;

  return (
    <section className="py-[120px] w-full overflow-hidden relative reveal">
      {/* Header */}
      <div className="text-center mb-16 px-4 md:px-16 max-w-screen-2xl mx-auto">
        <h2 className="font-display text-[48px] md:text-[64px] font-light leading-[1.0] tracking-[-0.02em] text-on-surface gradient-title-bg reveal reveal-clip">
          Voices of Sirini
        </h2>
        <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-on-surface-variant mt-3">
          Discover what our patrons have to say.
        </p>
      </div>

      {/* Carousel */}
      <div
        className="w-full relative py-4"
        id="testimonial-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Prev arrow */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous testimonial"
          className="group absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFDFB]/90 border border-[#E8D9CE] shadow-[0_4px_16px_rgba(120,80,60,0.12)] backdrop-blur-sm transition-colors hover:border-[#C9A96E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-on-surface-variant transition-colors group-hover:text-[#C9A96E]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Next arrow */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next testimonial"
          className="group absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFDFB]/90 border border-[#E8D9CE] shadow-[0_4px_16px_rgba(120,80,60,0.12)] backdrop-blur-sm transition-colors hover:border-[#C9A96E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-on-surface-variant transition-colors group-hover:text-[#C9A96E]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div
          ref={trackRef}
          id="testimonial-track"
          className="flex items-stretch"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            transition: "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
            willChange: "transform",
          }}
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              ref={(el) => { slideRefs.current[i] = el; }}
              className="shrink-0 w-[85%] md:w-[60%] lg:w-[45%] px-4 transition-all duration-700 ease-in-out"
              style={{ opacity: 0.4, transform: "scale(0.9)" }}
            >
              <div className="relative h-full flex flex-col justify-center items-center text-center bg-[#FFFDFB] border border-[#E8D9CE] rounded-2xl shadow-[0_8px_30px_rgba(120,80,60,0.08)] px-7 py-10 md:px-12 md:py-14">
                {/* Decorative opening quote mark */}
                <span
                  className="absolute top-5 left-6 font-display text-[64px] leading-none text-[#C9A96E]/25 select-none"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Gold star rating */}
                {(() => {
                  const rating = Math.max(1, Math.min(5, Math.round(t.rating ?? 5)));
                  return (
                    <div className="flex gap-1 mb-6" aria-label={`${rating} out of 5 stars`}>
                      {[...Array(5)].map((_, s) => (
                        <svg
                          key={s}
                          viewBox="0 0 24 24"
                          className={`w-4 h-4 ${s < rating ? "fill-[#C9A96E]" : "fill-[#E8D9CE]"}`}
                          aria-hidden="true"
                        >
                          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21.02 7 14.14 2 9.27l7.1-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  );
                })()}

                {/* Title */}
                <h3 className="font-sans text-[13px] tracking-[0.12em] uppercase text-primary font-semibold mb-4">
                  {t.title}
                </h3>

                {/* Quote */}
                <blockquote className="font-display text-[19px] md:text-[22px] leading-[1.55] italic font-light text-on-surface mb-7 max-w-md">
                  {t.quote}
                </blockquote>

                {/* Author */}
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-medium">
                  — {t.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div
        className="mt-10 flex flex-wrap items-center justify-center gap-2 px-4"
        role="tablist"
        aria-label="Select a testimonial"
      >
        {testimonials.map((t, i) => {
          const active = i === currentIndex;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Go to testimonial ${i + 1}: ${t.author}`}
              onClick={() => handleDotClick(i)}
              className={`rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] ${
                active
                  ? "h-2 w-5 bg-[#C9A96E]"
                  : "h-2 w-2 bg-[#E8D9CE] hover:bg-[#C9A96E]/50"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
