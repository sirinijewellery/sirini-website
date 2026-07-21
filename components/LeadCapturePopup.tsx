"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// One-time-per-browser email capture. Renders nothing until a ~8s timer fires
// on a visitor's first ever visit, then opens an elegant, compact dialog.
// The localStorage flag `sirini_lead_popup_done` is set both when the visitor
// subscribes AND when they dismiss, so the popup is shown at most once, ever.
// Mirrors AbandonedCartNudge's timer + guarded-storage structure (all storage
// access wrapped in try/catch for privacy mode / blocked storage).

const DONE_FLAG = "sirini_lead_popup_done";
const OPEN_DELAY_MS = 8_000;

// Module-level (survives client-side navigations, resets on full reload). Guards
// against a re-show within the same SPA session when the localStorage write
// failed — e.g. private mode / blocked storage — so we don't nag repeatedly.
let shownThisSession = false;

interface WelcomeCoupon {
  code: string;
  discountPercent: number;
  expiresAt: string;
}

export function LeadCapturePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // Set once a submit succeeds AND the server returned a real coupon — flips
  // the dialog into its success state showing the code.
  const [coupon, setCoupon] = useState<WelcomeCoupon | null>(null);
  const [copied, setCopied] = useState(false);

  const isExcludedPage =
    pathname?.startsWith("/admin") || pathname?.startsWith("/checkout");

  // Close an already-open dialog the moment navigation lands on an excluded
  // page. Adjusted during render (React's recommended pattern for state that
  // must react to a prop change) rather than in the effect below, so this
  // doesn't trigger an extra cascading render via a synchronous setState
  // inside a useEffect body.
  const prevExcludedRef = useRef(isExcludedPage);
  if (prevExcludedRef.current !== isExcludedPage) {
    prevExcludedRef.current = isExcludedPage;
    if (isExcludedPage && open) {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isExcludedPage) return;

    // Already shown this SPA session — don't re-arm even if the storage write
    // failed (private mode). Belt-and-braces with the localStorage flag below.
    if (shownThisSession) return;

    // Only ever show once per browser. Storage access can throw
    // (private mode / blocked storage) — never crash, just bail.
    try {
      if (localStorage.getItem(DONE_FLAG)) return;
    } catch {
      return;
    }

    const timer = window.setTimeout(() => {
      // Re-check the guards at fire time — a submit elsewhere or a second
      // mount may have set the flag since the timer was armed.
      if (shownThisSession) return;
      try {
        if (localStorage.getItem(DONE_FLAG)) return;
      } catch {
        // Storage unreadable (private mode) — still show once for this session.
      }
      shownThisSession = true;
      setOpen(true);
    }, OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isExcludedPage]);

  // Persist the one-time flag and close. Called on both dismiss and success.
  function markDone() {
    try {
      localStorage.setItem(DONE_FLAG, "1");
    } catch {
      // Non-fatal — worst case the popup could reappear next session.
    }
  }

  function handleOpenChange(next: boolean) {
    // Any close (X or backdrop click) counts as "seen" — never nag again.
    if (!next) {
      markDone();
      setOpen(false);
    }
  }

  async function handleCopy() {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions / insecure context) — the code is still
      // visible on screen, so just nudge the visitor to copy it manually.
      toast.error("Couldn't copy automatically — please copy the code above.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });

      if (res.ok) {
        // Mark seen either way — a successful capture should never re-nag.
        markDone();
        setEmail("");

        let data: { coupon?: WelcomeCoupon } | null = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (data?.coupon?.code) {
          // Real code came back — switch to the success state and keep the
          // dialog open so the visitor can read/copy it.
          setCoupon(data.coupon);
        } else {
          // Mint failed server-side — don't show an empty code box; fall back
          // to the original toast-only success.
          toast.success("You're on the list — welcome to Sirini.");
          setOpen(false);
        }
      } else if (res.status === 429) {
        toast.error("That's a few tries in a row — please try again shortly.");
      } else {
        // 400 (invalid email) or any other non-ok — keep it friendly, no raw errors.
        toast.error("Please enter a valid email address.");
      }
    } catch {
      toast.error("Couldn't reach us just now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const expiryNote = coupon
    ? (() => {
        const d = new Date(coupon.expiresAt);
        return Number.isNaN(d.getTime())
          ? null
          : `Valid until ${d.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}.`;
      })()
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm p-8 bg-background text-center">
        {coupon ? (
          <>
            <DialogHeader className="items-center gap-3">
              <DialogTitle className="font-display text-2xl text-on-surface leading-tight">
                Here&rsquo;s your code
              </DialogTitle>
              <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
                {coupon.discountPercent}% off your first order.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="flex-1 border border-outline rounded-md py-3 px-4 font-mono text-lg tracking-[0.2em] text-on-surface select-all">
                {coupon.code}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Code copied" : "Copy code"}
                className="shrink-0 border border-outline rounded-md p-3 text-on-surface-variant hover:text-on-surface hover:border-primary transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="size-5" aria-hidden="true" />
                ) : (
                  <Copy className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>

            {copied && (
              <p className="mt-2 font-body-md text-xs text-primary" role="status">
                Copied to clipboard
              </p>
            )}

            <p className="mt-3 font-body-md text-xs text-on-surface-variant/70">
              Apply it at checkout.{expiryNote ? ` ${expiryNote}` : ""}
            </p>
          </>
        ) : (
          <>
            <DialogHeader className="items-center gap-3">
              <DialogTitle className="font-display text-2xl text-on-surface leading-tight">
                Welcome to Sirini
              </DialogTitle>
              <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
                Leave your email and enjoy 10% off your first order.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="mt-2 flex flex-col gap-4 text-left"
            >
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
                className="w-full bg-transparent border-b border-outline py-3 px-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-3 text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300 animate-shimmer-btn disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Adding you…" : "Reveal my 10% off"}
              </button>
            </form>

            <p className="mt-1 font-body-md text-xs text-on-surface-variant/70">
              Occasional updates only. Reply unsubscribe anytime.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
