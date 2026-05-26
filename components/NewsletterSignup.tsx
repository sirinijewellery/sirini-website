"use client";

import { useState } from "react";

// Client component — POST to /api/newsletter.
// Bottom-border-only input, shimmer CTA button (animate-shimmer-btn from globals.css),
// bg-surface-container section background, centered editorial layout.

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { message?: string }).message ||
            "Something went wrong. Please try again."
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-surface-container py-[120px] px-4 md:px-16 reveal">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
        <h2 className="font-headline-lg text-headline-lg text-on-surface gradient-title-bg">
          Join the Inner Circle
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Subscribe to receive early access to new collections, exclusive editorial content, and personalized styling advice.
        </p>

        {submitted ? (
          <div className="flex items-center gap-2 mt-2 font-body-md text-body-md text-primary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M5 8l2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Subscribed — welcome to the circle.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full mt-4 flex flex-col sm:flex-row gap-4"
          >
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
              className="flex-1 bg-transparent border-b border-outline py-3 px-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300 sm:w-auto w-full animate-shimmer-btn disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}

        {error && (
          <p className="font-body-md text-body-md text-destructive -mt-2">{error}</p>
        )}
      </div>
    </section>
  );
}
