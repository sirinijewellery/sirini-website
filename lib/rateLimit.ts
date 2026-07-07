// ─────────────────────────────────────────────────────────────────────────
// Lightweight in-memory fixed-window rate limiter for PUBLIC POST endpoints
// (contact form, newsletter signup, product reviews). Zero-dependency — no
// Redis/Upstash to provision.
//
// CAVEAT: on Vercel, requests spread across ephemeral serverless instances that
// each hold their own memory, so this throttles per-instance, not globally. It
// still meaningfully blunts a single-source flood (the common abuse) and costs
// nothing. If a hard global guarantee is ever needed, swap the Map for Upstash
// Ratelimit behind this same interface.
// ─────────────────────────────────────────────────────────────────────────

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();
let lastSweep = 0;

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets — send as the `Retry-After` header. */
  retryAfter: number;
}

/**
 * Fixed-window limiter. Allows `limit` hits per `windowMs` for a given key.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the Map can't grow unbounded on a long-lived
  // instance. Cheap: at most once a minute, drop only expired windows.
  if (now - lastSweep > 60_000) {
    for (const [k, w] of buckets) {
      if (w.resetAt <= now) buckets.delete(k);
    }
    lastSweep = now;
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

/**
 * Derives a client key from the request — the first hop of `x-forwarded-for`
 * (the real client IP on Vercel). Scope namespaces the limit per endpoint so a
 * contact submission doesn't consume a newsletter allowance.
 */
export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}

/**
 * Convenience wrapper: enforce a limit for `scope` on this request. Returns a
 * ready-to-send 429 `Response` when exceeded, or `null` to proceed.
 */
export function enforceRateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number
): Response | null {
  const { ok, retryAfter } = rateLimit(clientKey(req, scope), limit, windowMs);
  if (ok) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again in a little while." }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
    }
  );
}
