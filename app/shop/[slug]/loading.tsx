// Route-level skeleton for /shop/[slug] — mirrors the real PDP layout
// (breadcrumb, image gallery + thumbnails, info column) from page.tsx's
// `grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16` inside a max-w-7xl shell.
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="h-3 w-64 skeleton-shimmer rounded mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Left — image gallery placeholder */}
        <div className="space-y-3">
          <div className="aspect-square skeleton-shimmer rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-16 h-16 shrink-0 skeleton-shimmer rounded-lg" />
            ))}
          </div>
        </div>

        {/* Right — product info placeholder */}
        <div className="space-y-6">
          <div className="h-3 w-28 skeleton-shimmer rounded" />

          {/* Title — two lines, matches the display heading's wrap */}
          <div className="space-y-3">
            <div className="h-9 w-full skeleton-shimmer rounded" />
            <div className="h-9 w-2/3 skeleton-shimmer rounded" />
          </div>

          {/* Price */}
          <div className="h-7 w-32 skeleton-shimmer rounded" />

          {/* Urgency line */}
          <div className="h-4 w-56 skeleton-shimmer rounded" />

          {/* Description */}
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full skeleton-shimmer rounded" />
            <div className="h-3 w-full skeleton-shimmer rounded" />
            <div className="h-3 w-4/5 skeleton-shimmer rounded" />
          </div>

          {/* Add-to-cart CTA */}
          <div className="h-12 w-full skeleton-shimmer rounded" />
        </div>
      </div>
    </div>
  );
}
