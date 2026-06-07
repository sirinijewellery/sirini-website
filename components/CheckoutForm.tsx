"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";
import { trackCheckoutStarted, trackPurchaseCompleted } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, MapPin, Lock, ChevronRight, CreditCard, Banknote } from "lucide-react";
import { getMrp, formatPrice } from "@/components/PriceDisplay";
import { CouponField } from "@/components/CouponField";

/* ── Razorpay Checkout (loaded on demand) ───────────────────────────── */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;
function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => { razorpayScriptPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return razorpayScriptPromise;
}

/* ── Types ──────────────────────────────────────────────────────────── */

interface Address {
  id: string;
  label: string | null;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface CheckoutFormProps {
  savedAddresses: Address[];
}

/* ── India States / UTs ─────────────────────────────────────────────── */

const INDIA_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

/* ── StateCombobox ──────────────────────────────────────────────────── */

interface StateComboboxProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

function StateCombobox({ value, onChange, error }: StateComboboxProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep inputValue in sync when an external value change arrives
  // (e.g. selectSavedAddress sets the RHF value, which flows in as `value`)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered =
    inputValue.trim() === ""
      ? INDIA_STATES
      : INDIA_STATES.filter((s) =>
          s.toLowerCase().includes(inputValue.trim().toLowerCase())
        );

  function handleSelect(state: string) {
    setInputValue(state);
    onChange(state);
    setIsOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    onChange(e.target.value); // keep RHF in sync while typing
    setIsOpen(true);
  }

  function handleBlur() {
    // Delay so a click on a list item fires before the dropdown closes
    blurTimerRef.current = setTimeout(() => {
      // Fuzzy autocorrect: if the typed text matches exactly one state, use it
      const typed = inputValue.trim().toLowerCase();
      if (typed !== "") {
        const matches = INDIA_STATES.filter((s) =>
          s.toLowerCase().includes(typed)
        );
        if (matches.length === 1) {
          setInputValue(matches[0]);
          onChange(matches[0]);
        }
      }
      setIsOpen(false);
    }, 150);
  }

  function handleFocus() {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }
    setIsOpen(true);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Maharashtra"
        autoComplete="off"
        aria-invalid={!!error}
        aria-autocomplete="list"
        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-sans transition-colors ${
          error ? "border-destructive" : "border-input"
        }`}
      />
      {isOpen && filtered.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-52 overflow-y-auto"
          role="listbox"
        >
          {filtered.map((state) => (
            <li
              key={state}
              role="option"
              aria-selected={state === value}
              onMouseDown={() => handleSelect(state)}
              className={`cursor-pointer px-3 py-2 font-sans text-sm text-foreground hover:bg-primary/10 transition-colors ${
                state === value ? "bg-primary/10 font-medium" : ""
              }`}
            >
              {state}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Zod schema ─────────────────────────────────────────────────────── */

const checkoutSchema = z.object({
  customerName: z.string().min(1, "Full name is required"),
  customerEmail: z.string().email("Enter a valid email address"),
  customerPhone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  line1: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  label: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFields = z.infer<typeof checkoutSchema>;

/* ── Helpers ─────────────────────────────────────────────────────────── */

function formatINR(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

/* ── Trust badges ────────────────────────────────────────────────────── */

function TrustBadges() {
  const iconClass = "h-3.5 w-3.5 shrink-0";
  const gold = "#C9A96E";
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[11px] font-sans text-muted-foreground">
      <span className="flex items-center gap-1.5">
        {/* lock */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke={gold}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={iconClass}
          aria-hidden="true"
        >
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        100% Secure Payments
      </span>
      <span className="flex items-center gap-1.5">
        {/* badge-check */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke={gold}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={iconClass}
          aria-hidden="true"
        >
          <path d="M12 2 14.4 4.2 17.6 4 18 7.2 20.6 9 19.2 12 20.6 15 18 16.8 17.6 20 14.4 19.8 12 22 9.6 19.8 6.4 20 6 16.8 3.4 15 4.8 12 3.4 9 6 7.2 6.4 4 9.6 4.2 12 2Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        Verified Seller on Flipkart &amp; Amazon
      </span>
      <span className="flex items-center gap-1.5">
        {/* return arrow */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke={gold}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={iconClass}
          aria-hidden="true"
        >
          <path d="M3 7v6h6" />
          <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
        </svg>
        7-Day Easy Returns
      </span>
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────────────── */

export function CheckoutForm({ savedAddresses }: CheckoutFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotal, appliedCoupon, setCoupon, clearCart } = useCartStore();

  const [selectedSavedId, setSelectedSavedId] = useState<string | "new">(
    savedAddresses.length > 0 ? savedAddresses[0].id : "new"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod" | null>(null);
  const [giftWrap, setGiftWrap] = useState(false);

  const GIFT_WRAP_FEE = 49; // ₹49 — kept in sync with server-side fee

  const subtotal = getTotal();
  const discount = appliedCoupon?.discountAmount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const gst = Math.round(discountedSubtotal * 0.03);
  const shipping = 0; // Free shipping
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0;
  // Allow ₹0 so a 100%-off coupon (e.g. FREE1) can make the order truly free.
  const total = Math.max(0, discountedSubtotal + gst + shipping + giftWrapFee);
  const compareTotal = items.reduce(
    (s, i) => s + (i.compareAtPrice ?? getMrp(i.price)) * i.quantity,
    0
  );
  const savings = compareTotal - subtotal;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CheckoutFields>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
    },
  });

  const stateValue = watch("state") ?? "";

  // Session may resolve after mount — backfill name/email once available
  useEffect(() => {
    if (session?.user) {
      reset((prev) => ({
        ...prev,
        customerName: prev.customerName || session.user!.name || "",
        customerEmail: prev.customerEmail || session.user!.email || "",
      }));
    }
  }, [session?.user?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  // When user picks a saved address, populate the hidden form fields
  function selectSavedAddress(addr: Address) {
    setSelectedSavedId(addr.id);
    setValue("line1", addr.line1);
    setValue("city", addr.city);
    setValue("state", addr.state);
    setValue("pincode", addr.pincode);
    setValue("label", addr.label ?? "");
  }

  async function onSubmit(values: CheckoutFields) {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);

    // Free order (e.g. FREE1 100%-off) → no payment needed, place directly.
    const isFree = total <= 0;

    // Payment method guard (skipped for free orders)
    if (!paymentMethod && !isFree) {
      toast.error("Don't get too excited! Please pick a payment method.");
      setIsLoading(false);
      return;
    }

    const address = {
      line1: values.line1,
      city: values.city,
      state: values.state,
      pincode: values.pincode,
      label: values.label,
    };

    /* ── COD / Free flow (no payment gateway) ─────────────────────── */
    if (paymentMethod === "cod" || isFree) {
      try {
        const res = await fetch("/api/checkout/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            address,
            customerName: values.customerName,
            customerEmail: values.customerEmail,
            customerPhone: values.customerPhone,
            couponCode: appliedCoupon?.code,
            totalAmount: total,
            giftWrap,
            notes: values.notes,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error ?? "Failed to place order");
          setIsLoading(false);
          return;
        }

        clearCart();
        router.push(`/order-confirmation?orderId=${data.orderId}`);
      } catch {
        toast.error("Network error. Please check your connection and try again.");
        setIsLoading(false);
      }
      return;
    }

    /* ── Razorpay Checkout (secure — payment is signature-verified) ─── */
    const lineItems = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));
    try {
      // 1. Create a real Razorpay order server-side (amount computed on server)
      const orderRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lineItems,
          address,
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone,
          couponCode: appliedCoupon?.code,
          giftWrap,
          notes: values.notes,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        toast.error(orderData.error ?? "Couldn't start payment. Please try again.");
        setIsLoading(false);
        return;
      }

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        toast.error("Couldn't load the payment gateway. Check your connection and retry.");
        setIsLoading(false);
        return;
      }

      trackCheckoutStarted(total);

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: "INR",
        name: "Sirini Jewellery",
        description: "Order payment",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: values.customerName,
          email: values.customerEmail,
          contact: values.customerPhone,
        },
        theme: { color: "#5C1A24" },
        // 2. On success Razorpay returns a signed payload — verified server-side.
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                items: lineItems,
                address,
                customerName: values.customerName,
                customerEmail: values.customerEmail,
                customerPhone: values.customerPhone,
                couponCode: appliedCoupon?.code,
                totalAmount: total,
                giftWrap,
                notes: values.notes,
              }),
            });
            const vData = await verifyRes.json();
            if (!verifyRes.ok) {
              toast.error(vData.error ?? "Payment verification failed. If money was deducted, please contact us.");
              setIsLoading(false);
              return;
            }
            clearCart();
            trackPurchaseCompleted(vData.orderId, total);
            router.push(`/order-confirmation?orderId=${vData.orderId}`);
          } catch {
            toast.error("Could not confirm payment. If money was deducted, please contact us.");
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast("Payment cancelled.");
          },
        },
      });
      rzp.open();
    } catch {
      toast.error("Network error starting payment. Please try again.");
      setIsLoading(false);
    }
  }

  /* ── Empty cart guard ─────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="font-display text-2xl font-light text-foreground">Your cart is empty</p>
        <p className="font-sans text-muted-foreground text-sm">Add items before checking out.</p>
        <Link href="/shop">
          <Button className="mt-2">Browse Collection</Button>
        </Link>
      </div>
    );
  }

  /* ── Main form ────────────────────────────────────────────────────── */
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* Contact details */}
            <section>
              <h2 className="font-display text-2xl font-light text-foreground mb-5">
                Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <Label htmlFor="customerName">Full Name</Label>
                  <Input
                    id="customerName"
                    placeholder="e.g. Priya Sharma"
                    aria-invalid={!!errors.customerName}
                    {...register("customerName")}
                  />
                  {errors.customerName && (
                    <p className="text-xs text-destructive font-sans">{errors.customerName.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="customerPhone">Mobile Number</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit number"
                    maxLength={10}
                    aria-invalid={!!errors.customerPhone}
                    {...register("customerPhone")}
                  />
                  {errors.customerPhone && (
                    <p className="text-xs text-destructive font-sans">{errors.customerPhone.message}</p>
                  )}
                </div>

                {/* Email — full width */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="you@example.com"
                    aria-invalid={!!errors.customerEmail}
                    {...register("customerEmail")}
                  />
                  {errors.customerEmail && (
                    <p className="text-xs text-destructive font-sans">{errors.customerEmail.message}</p>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* Shipping address */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="font-display text-2xl font-light text-foreground">
                  Shipping Address
                </h2>
              </div>

              {/* Saved address picker */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3 mb-6">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedSavedId === addr.id
                          ? "border-primary bg-blush/30"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => selectSavedAddress(addr)}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        value={addr.id}
                        checked={selectedSavedId === addr.id}
                        onChange={() => selectSavedAddress(addr)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        {addr.label && (
                          <span className="text-xs font-sans font-semibold text-primary uppercase tracking-wide">
                            {addr.label}
                          </span>
                        )}
                        <p className="font-sans text-sm text-foreground mt-0.5">
                          {addr.line1}, {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </label>
                  ))}

                  {/* New address option */}
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedSavedId === "new"
                        ? "border-primary bg-blush/30"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedSavedId("new")}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      value="new"
                      checked={selectedSavedId === "new"}
                      onChange={() => setSelectedSavedId("new")}
                      className="accent-primary"
                    />
                    <span className="font-sans text-sm text-foreground">Use a new address</span>
                  </label>
                </div>
              )}

              {/* Address form — shown when "new" or no saved addresses */}
              {(selectedSavedId === "new" || savedAddresses.length === 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Street address — full width */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="line1">Street Address</Label>
                    <Input
                      id="line1"
                      placeholder="Flat/House no., Street, Area"
                      aria-invalid={!!errors.line1}
                      {...register("line1")}
                    />
                    {errors.line1 && (
                      <p className="text-xs text-destructive font-sans">{errors.line1.message}</p>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      aria-invalid={!!errors.city}
                      {...register("city")}
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive font-sans">{errors.city.message}</p>
                    )}
                  </div>

                  {/* State — combobox */}
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <StateCombobox
                      value={stateValue}
                      onChange={(val) => setValue("state", val, { shouldValidate: true })}
                      error={errors.state?.message}
                    />
                    {errors.state && (
                      <p className="text-xs text-destructive font-sans">{errors.state.message}</p>
                    )}
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      type="text"
                      inputMode="numeric"
                      placeholder="400001"
                      maxLength={6}
                      aria-invalid={!!errors.pincode}
                      {...register("pincode")}
                    />
                    {errors.pincode && (
                      <p className="text-xs text-destructive font-sans">{errors.pincode.message}</p>
                    )}
                  </div>

                  {/* Label (optional) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="label">
                      Address Label{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="label"
                      placeholder="Home / Office / Other"
                      {...register("label")}
                    />
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* Order notes */}
            <section>
              <h2 className="font-display text-2xl font-light text-foreground mb-5">
                Order Notes
              </h2>
              <div className="space-y-1.5">
                <Label htmlFor="notes">
                  Special Instructions{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Gift wrapping request, delivery instructions, etc."
                  className="resize-none min-h-24"
                  {...register("notes")}
                />
              </div>
            </section>

            <Separator />

            {/* Payment method */}
            <section>
              <h2 className="font-display text-2xl font-light text-foreground mb-5">
                Payment Method
              </h2>
              <div className="space-y-3">
                {/* Razorpay option */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === "razorpay"
                      ? "border-primary bg-blush/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <CreditCard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-sans text-sm font-medium text-foreground">Pay Online</p>
                      <p className="font-sans text-xs text-muted-foreground mt-0.5">
                        UPI, credit/debit cards, net banking — secure Razorpay checkout
                      </p>
                    </div>
                  </div>
                </label>

                {/* COD option */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === "cod"
                      ? "border-primary bg-blush/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Banknote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-sans text-sm font-medium text-foreground">Cash on Delivery</p>
                      <p className="font-sans text-xs text-muted-foreground mt-0.5">
                        Pay in cash when your order arrives
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* ── RIGHT COLUMN — Order Summary (sticky) ───────────────── */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="rounded-xl border border-border bg-card p-6 space-y-5 lg:sticky lg:top-24">
              <h2 className="font-display text-2xl font-light text-foreground">
                Order Summary
              </h2>

              {/* Items list */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId ?? "default"}`}
                    className="flex gap-3 items-start"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blush">
                          <span className="font-display text-primary text-lg font-light">S</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-medium text-foreground leading-tight line-clamp-2">
                        {item.name}
                      </p>
                      {(item.size || item.colour) && (
                        <p className="font-sans text-xs text-muted-foreground mt-0.5">
                          {[item.size, item.colour].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="font-sans text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-sans text-sm font-medium text-foreground shrink-0">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Gift wrap option */}
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer transition-colors hover:border-primary/50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blush/50">
                  {/* gift icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A96E"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect x="3" y="8" width="18" height="4" rx="1" />
                    <path d="M12 8v13" />
                    <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
                    <path d="M12 8C12 8 10.5 4 8 4a2 2 0 0 0 0 4h4Z" />
                    <path d="M12 8c0 0 1.5-4 4-4a2 2 0 0 1 0 4h-4Z" />
                  </svg>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-sm font-medium text-foreground">
                    Add gift wrapping
                  </span>
                  <span className="block font-sans text-xs text-muted-foreground">
                    Elegant box + ribbon · ₹49
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-primary cursor-pointer"
                  aria-label="Add gift wrapping for ₹49"
                />
              </label>

              <Separator />

              {/* Coupon code — apply/remove right here in checkout */}
              <CouponField
                subtotal={subtotal}
                appliedCoupon={appliedCoupon}
                onApply={setCoupon}
              />

              <Separator />

              {/* Pricing breakdown */}
              <div className="space-y-2 font-sans text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You save</span>
                    <span className="text-green-600">{formatPrice(savings)}</span>
                  </div>
                )}
                {discount > 0 && appliedCoupon && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>− {formatINR(discount)}</span>
                  </div>
                )}
                {/* GST */}
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (3%)</span>
                  <span>{formatINR(gst)}</span>
                </div>
                {/* Shipping */}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                {/* Gift wrap line item */}
                {giftWrap && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Gift Wrap</span>
                    <span>{formatINR(GIFT_WRAP_FEE)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-sans font-semibold text-foreground">Total</span>
                <span className="font-display text-2xl font-semibold text-primary">
                  {formatINR(total)}
                </span>
              </div>

              {/* Pay / Place order button — Razorpay opens a secure modal */}
              {(
                <>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-sans font-medium"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing…
                      </span>
                    ) : total <= 0 ? (
                      <span className="flex items-center gap-2">
                        Place Free Order
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    ) : paymentMethod === "cod" ? (
                      <span className="flex items-center gap-2">
                        Place Order
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Pay {formatINR(total)}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-sans">
                    <Lock className="h-3 w-3" />
                    <span>
                      {paymentMethod === "cod" ? "Secure checkout" : "Secured by Razorpay"}
                    </span>
                  </div>

                  <TrustBadges />
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
