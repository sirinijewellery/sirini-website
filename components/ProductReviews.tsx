"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface Review {
  id: string;
  authorName: string;
  rating: number;
  body: string | null;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

interface Props {
  productId: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Relative-time helper — "just now", "3 days ago", etc. */
function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo} month${diffMo !== 1 ? "s" : ""} ago`;
  const diffYr = Math.floor(diffMo / 12);
  return `${diffYr} year${diffYr !== 1 ? "s" : ""} ago`;
}

/* ------------------------------------------------------------------ */
/* Star SVG                                                             */
/* ------------------------------------------------------------------ */

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

interface StarProps {
  filled: boolean;
  size?: number;
  className?: string;
}

function Star({ filled, size = 16, className = "" }: StarProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={
        filled
          ? `text-amber-400 fill-amber-400 ${className}`
          : `text-muted-foreground fill-none stroke-current ${className}`
      }
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

interface StarRowProps {
  rating: number;
  size?: number;
  gap?: string;
}

function StarRow({ rating, size = 16, gap = "gap-0.5" }: StarRowProps) {
  return (
    <span className={`inline-flex ${gap}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= rating} size={size} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive star picker for the form                                 */
/* ------------------------------------------------------------------ */

interface StarPickerProps {
  value: number;
  onChange: (rating: number) => void;
}

function StarPicker({ value, onChange }: StarPickerProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <span className="inline-flex gap-1" role="group" aria-label="Select a star rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
          className="cursor-pointer transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
        >
          <Star filled={n <= active} size={24} />
        </button>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Review card                                                          */
/* ------------------------------------------------------------------ */

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="border border-border rounded-lg p-4 space-y-2 transition-colors duration-200 hover:border-primary/30">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-sans text-sm font-semibold text-foreground leading-tight">
            {review.authorName}
          </p>
          <time
            dateTime={review.createdAt}
            className="font-sans text-xs text-muted-foreground"
          >
            {relativeTime(review.createdAt)}
          </time>
        </div>
        <StarRow rating={review.rating} size={14} gap="gap-0.5" />
      </div>

      {/* Body */}
      {review.body && (
        <p className="font-sans text-sm text-foreground/80 leading-relaxed">
          {review.body}
        </p>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Submit form                                                          */
/* ------------------------------------------------------------------ */

interface SubmitFormProps {
  productId: string;
  onSuccess: () => void;
}

function SubmitForm({ productId, onSuccess }: SubmitFormProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name.trim(), rating, body: body.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }

      toast.success("Thank you! Your review has been submitted.");
      setName("");
      setRating(0);
      setBody("");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-4 border-t border-border">
      <h3 className="font-display text-lg font-light text-foreground">
        Write a Review
      </h3>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="review-name">Your name</Label>
        <Input
          id="review-name"
          type="text"
          placeholder="e.g. Priya S."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          disabled={submitting}
          className="h-9"
        />
      </div>

      {/* Star rating */}
      <div className="space-y-1.5">
        <Label>Rating</Label>
        <StarPicker value={rating} onChange={setRating} />
        {rating === 0 && (
          <p className="text-xs text-muted-foreground">Click to select a rating</p>
        )}
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="review-body">
          Your thoughts{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="review-body"
          placeholder="What did you love about it? How does it look in person?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
          disabled={submitting}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="h-9 px-6 font-sans text-sm"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                        */
/* ------------------------------------------------------------------ */

export function ProductReviews({ productId }: Props) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/${productId}`);
      if (!res.ok) throw new Error("Failed to load reviews");
      const json: ReviewsData = await res.json();
      setData(json);
    } catch {
      // Non-critical — silently degrade; page still renders
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <section
      aria-labelledby="reviews-heading"
      className="mt-16 max-w-2xl"
    >
      {/* Section heading */}
      <h2
        id="reviews-heading"
        className="font-display text-2xl font-light text-foreground mb-6"
      >
        Reviews
      </h2>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((n) => (
            <div key={n} className="border border-border rounded-lg p-4 space-y-2">
              <div className="h-3 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {!loading && data && (
        <>
          {data.totalCount === 0 ? (
            <p className="font-sans text-sm text-muted-foreground mb-8">
              No reviews yet — be the first to share your thoughts.
            </p>
          ) : (
            <div className="mb-8 space-y-3">
              {/* Aggregate rating */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <StarRow rating={Math.round(data.averageRating)} size={20} gap="gap-1" />
                <span className="font-sans text-sm text-muted-foreground">
                  {data.averageRating.toFixed(1)}{" "}
                  <span className="text-foreground/60">
                    ({data.totalCount} {data.totalCount === 1 ? "review" : "reviews"})
                  </span>
                </span>
              </div>

              {/* Individual reviews */}
              <div className="space-y-4">
                {data.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}

          {/* Submit form */}
          <SubmitForm productId={productId} onSuccess={fetchReviews} />
        </>
      )}

      {/* Edge case: fetch failed entirely */}
      {!loading && !data && (
        <SubmitForm productId={productId} onSuccess={fetchReviews} />
      )}
    </section>
  );
}
