// Route-level skeleton for /shop — mirrors the real listing layout (header,
// desktop sidebar column, sort bar, product grid) so there's no layout jump
// once data arrives. Grid columns/gaps match components/ProductGrid.tsx.
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header — breadcrumb + title + count */}
      <div className="mb-10 space-y-4">
        <div className="h-3 w-56 skeleton-shimmer rounded" />
        <div className="h-10 w-64 skeleton-shimmer rounded" />
        <div className="h-3 w-24 skeleton-shimmer rounded" />
      </div>

      <div className="lg:flex lg:gap-6 lg:items-start">
        {/* Sidebar — desktop filters column only (mobile filter bar omitted) */}
        <div className="hidden lg:block lg:w-[200px] lg:shrink-0 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-4 skeleton-shimmer rounded"
              style={{ width: `${55 + (i % 3) * 15}%` }}
            />
          ))}
        </div>

        {/* Products column */}
        <div className="mt-6 lg:mt-0 lg:flex-1 lg:min-w-0 space-y-6">
          {/* Sort bar */}
          <div className="flex items-center justify-between">
            <div className="hidden sm:block h-4 w-40 skeleton-shimmer rounded" />
            <div className="h-9 w-36 skeleton-shimmer rounded ml-auto" />
          </div>

          {/* Product grid — matches ProductGrid's column/gap classes */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[4/5] skeleton-shimmer" />
                <div className="h-3 w-3/4 skeleton-shimmer rounded" />
                <div className="h-4 w-1/2 skeleton-shimmer rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
