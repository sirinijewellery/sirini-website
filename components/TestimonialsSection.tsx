"use client";

import { useState, useEffect, useRef } from "react";

// Center-focused carousel matching Stitch HTML exactly.
// Active slide: opacity-100 scale-100, centered via translateX offset.
// Inactive slides: opacity-40 scale-90. Auto-advances every 3478ms.

const testimonials = [
  { title: "Elegant & Premium Quality", quote: "I absolutely loved the jewelry from Sirini. The quality, shine, and detailing are truly amazing. It looks very premium and elegant, perfect for weddings and festive occasions.", author: "Priya Sharma" },
  { title: "Beautiful Traditional Design", quote: "The design is beautiful, lightweight, and very comfortable to wear all day. The finishing looks luxurious and matches perfectly with ethnic outfits. Highly recommended!", author: "Anjali Verma" },
  { title: "Royal Look & Amazing Finish", quote: "The craftsmanship and elegance are outstanding. Every detail looks carefully designed, and the quality feels premium. It adds a classy and royal touch to any look.", author: "Isha Singh" },
  { title: "Perfect for Every Occasion", quote: "I am really impressed with the beautiful design and premium finishing. The product looks exactly like the pictures and feels very stylish. Perfect for any special event.", author: "Sneha Kapoor" },
  { title: "Stylish & Comfortable", quote: "The jewelry is elegant, trendy, and comfortable to wear. The shine and detailing make it look very expensive and luxurious. A perfect addition to my collection.", author: "Pooja Singh" },
  { title: "Luxury Feel & Stunning Shine", quote: "I'm extremely happy with my purchase. The jewelry has a beautiful shine, premium finishing, and elegant design that instantly enhances the overall look.", author: "Kavya Jain" },
  { title: "Impeccable Attention to Detail", quote: "Absolutely stunning pieces that elevate any outfit. The attention to detail is impeccable, reflecting true mastery of traditional jewelry making.", author: "Meera R." },
  { title: "A Beautiful Blend", quote: "A beautiful blend of tradition and modernity. I wore their necklace set for my wedding and felt like absolute royalty. Every guest asked about it.", author: "Aditi S." },
  { title: "Unparalleled Craftsmanship", quote: "The craftsmanship is unparalleled. Each piece feels like a cherished heirloom that has been passed down through generations. Simply breathtaking.", author: "Riya G." },
  { title: "Timeless Designs", quote: "Exceptional quality and timeless designs. The quiet luxury aesthetic they offer is hard to find anywhere else. I will definitely be returning for more.", author: "Sana K." },
  { title: "Bridal Set of My Dreams", quote: "I bought a Kundan bridal set for my wedding and it was beyond beautiful. The pearls and stonework looked so rich in every photo. Worth every rupee.", author: "Nidhi Agarwal" },
  { title: "Festive Favourite", quote: "Wore the jhumkas for Diwali and got endless compliments. Lightweight enough to wear all evening, yet they sparkle like real gold. Absolutely love them.", author: "Tanvi Mehta" },
  { title: "Fast Delivery, Lovely Packaging", quote: "The order arrived earlier than expected and the packaging was so elegant — it felt like opening a gift. The anklets are dainty and gorgeous.", author: "Shruti Nair" },
  { title: "Gifted & Loved", quote: "I gifted a Meenakari necklace set to my mother and she was overjoyed. The enamel work is so detailed and the colours are stunning in person.", author: "Ananya Iyer" },
  { title: "My Go-To for Ethnic Wear", quote: "Every time I have a function, Sirini is my first stop. The pieces pair beautifully with sarees and lehengas, and the quality never disappoints.", author: "Divya Reddy" },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  useEffect(() => {
    // Initial position after layout
    const initTimer = setTimeout(() => updateCarousel(currentIndex), 50);

    // Auto-advance
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % testimonials.length;
        updateCarousel(next);
        return next;
      });
    }, 3478);

    // Resize handler
    const handleResize = () => updateCarousel(currentIndex);
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When currentIndex changes from the interval, keep carousel in sync
  useEffect(() => {
    updateCarousel(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <section className="py-[120px] w-full overflow-hidden relative reveal">
      {/* Header */}
      <div className="text-center mb-16 px-4 md:px-16 max-w-screen-2xl mx-auto">
        <h2 className="font-display text-[48px] md:text-[64px] font-light leading-[1.0] tracking-[-0.02em] text-on-surface gradient-title-bg">
          Voices of Sirini
        </h2>
        <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-on-surface-variant mt-3">
          Discover what our patrons have to say.
        </p>
      </div>

      {/* Carousel */}
      <div className="w-full relative py-4" id="testimonial-container">
        <div
          ref={trackRef}
          id="testimonial-track"
          className="flex items-stretch"
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
                <div className="flex gap-1 mb-6" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" className="w-4 h-4 fill-[#C9A96E]" aria-hidden="true">
                      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21.02 7 14.14 2 9.27l7.1-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

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
    </section>
  );
}
