// Server component — no "use client"
// Warm-editorial: full-bleed photography with bottom gradient overlay,
// centered serif headline with staggered animate-slide-up-fade entrance.

// Cloudinary crop: w_1920,h_900,c_fill,g_south — anchors to bottom of image
// so the necklace/chest area is the focal point, not the face.
const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/w_1920,h_900,c_fill,g_south/v1779795103/sirini-jewellery/10ns787/10NS787-11225-Model.jpg";

export function HeroSection() {
  return (
    <section className="relative w-full h-[819px] min-h-[600px] flex items-center justify-center overflow-hidden reveal">

      {/* Full-bleed background image with bottom-fade overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 text-center px-4 md:px-16 max-w-4xl mx-auto flex flex-col items-center gap-8 mt-20">

        {/* Display headline */}
        <h1 className="font-display-lg text-display-lg md:text-[72px] md:leading-[1.1] text-on-surface animate-slide-up-fade">
          The Heritage of Elegance
        </h1>

        {/* Subtitle */}
        <p
          className="font-body-lg text-body-lg text-on-surface-variant max-w-lg animate-slide-up-fade"
          style={{ animationDelay: "200ms" }}
        >
          Discover handcrafted jewelry that bridges centuries of artisanal tradition with modern minimalist design.
        </p>

        {/* CTA */}
        <a
          className="mt-4 inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300 animate-slide-up-fade cursor-pointer"
          href="/shop"
          style={{ animationDelay: "400ms" }}
        >
          Shop the Collection
        </a>

      </div>
    </section>
  );
}
