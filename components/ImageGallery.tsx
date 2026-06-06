"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

/* ── Lightbox ─────────────────────────────────────────────────── */

interface LightboxProps {
  images: string[];
  productName: string;
  startIndex: number;
  onClose: () => void;
}

function Lightbox({ images, productName, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  /* Keyboard navigation */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, prev, next]);

  /* Prevent body scroll while open */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const showArrows = images.length > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${images.length} — ${productName}`}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors duration-150 cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main image — stop propagation so click on image doesn't close */}
      <div
        className="relative flex items-center justify-center w-full px-4 md:px-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Desktop: side arrows */}
        {showArrows && (
          <button
            onClick={prev}
            aria-label="Previous image"
            className="hidden md:flex absolute left-4 items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors duration-150 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={`${productName} — image ${index + 1} of ${images.length}`}
          className="max-h-[80vh] max-w-[90vw] md:max-w-[70vw] w-auto h-auto object-contain rounded-lg select-none"
          draggable={false}
        />

        {showArrows && (
          <button
            onClick={next}
            aria-label="Next image"
            className="hidden md:flex absolute right-4 items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors duration-150 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Mobile: prev / next buttons below image */}
      {showArrows && (
        <div
          className="flex md:hidden gap-6 mt-5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={prev}
            aria-label="Previous image"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-sans hover:bg-white/25 transition-colors duration-150 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-sans hover:bg-white/25 transition-colors duration-150 cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image counter */}
      <p
        className="mt-4 text-white/60 text-xs font-sans tracking-widest select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {index + 1} / {images.length}
      </p>
    </div>,
    document.body
  );
}

/* ── ImageGallery ─────────────────────────────────────────────── */

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainImageWrapperRef = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState({ visible: false, x: 0, y: 0, bgX: 50, bgY: 50 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = mainImageWrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const pctX = (relX / rect.width) * 100;
    const pctY = (relY / rect.height) * 100;
    const LENS = 128;
    const lensLeft = Math.min(Math.max(relX - LENS / 2, 0), rect.width - LENS);
    const lensTop = Math.min(Math.max(relY - LENS / 2, 0), rect.height - LENS);
    setLens({ visible: true, x: lensLeft, y: lensTop, bgX: pctX, bgY: pctY });
  }

  /* Images arrive pre-sorted (model → full jewellery → detail shots).
     Do not re-sort here. */

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-xl bg-muted flex items-center justify-center">
        <span className="font-display text-6xl text-primary opacity-30">S</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image — zoom cursor signals it's clickable */}
        {/* CLS note: outer div is `relative w-full`; button child uses `aspect-square`
            which establishes an intrinsic height — browser reserves space before image
            loads, so no layout shift occurs. */}
        <div
          ref={mainImageWrapperRef}
          className="relative w-full"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setLens((l) => ({ ...l, visible: true }))}
          onMouseLeave={() => setLens((l) => ({ ...l, visible: false }))}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted cursor-crosshair focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`View ${productName} image ${activeIndex + 1} in full screen`}
          >
            <Image
              src={images[activeIndex]}
              alt={`${productName} — ${activeIndex === 0 ? "main view" : `view ${activeIndex + 1}`} | Sirini Jewellery`}
              fill
              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              priority={activeIndex === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </button>

          {/* Zoom lens — desktop only, sits outside button to avoid overflow-hidden clip */}
          {lens.visible && (
            <div
              className="hidden md:block absolute pointer-events-none border border-[#C9A96E]/70 z-10"
              style={{
                width: 128,
                height: 128,
                left: lens.x,
                top: lens.y,
                backgroundImage: `url(${images[activeIndex]})`,
                backgroundSize: "300% 300%",
                backgroundPosition: `${lens.bgX}% ${lens.bgY}%`,
              }}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Thumbnails — unchanged from original */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                  i === activeIndex
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                aria-label={`View ${productName} thumbnail ${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
              >
                <Image
                  src={img}
                  alt={`${productName} thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Portal lightbox — rendered in document.body to avoid z-index stacking */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          productName={productName}
          startIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
