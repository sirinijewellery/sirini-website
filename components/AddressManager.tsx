"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PencilIcon, TrashIcon, PlusIcon, MapPinIcon, StarIcon } from "lucide-react";
import { CityCombobox } from "@/components/CityCombobox";

// ── India States / UTs ─────────────────────────────────────────────────────────

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

// ── StateCombobox ──────────────────────────────────────────────────────────────

interface StateComboboxProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  inputClass?: string;
}

function StateCombobox({ value, onChange, error, inputClass }: StateComboboxProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from an external value change during render (React's documented
  // "previous render" pattern) — no extra stale frame, no effect cascade.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

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
    onChange(e.target.value);
    setIsOpen(true);
  }

  function handleBlur() {
    blurTimerRef.current = setTimeout(() => {
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
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
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
        className={inputClass}
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

// ── Types ──────────────────────────────────────────────────────────────────────

interface Address {
  id: string;
  userId: string;
  label: string | null;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// ── Validation schema ──────────────────────────────────────────────────────────

const addressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(1, "Address line 1 is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

// ── Address Card ───────────────────────────────────────────────────────────────

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border bg-card p-5 transition-shadow duration-200 hover:shadow-md ${
        address.isDefault ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
      }`}
    >
      {/* Default badge */}
      {address.isDefault && (
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-sans font-medium uppercase tracking-widest text-primary">
          <StarIcon className="h-2.5 w-2.5 fill-primary" />
          Default
        </span>
      )}

      {/* Label */}
      {address.label && (
        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-primary mb-2">
          {address.label}
        </p>
      )}

      {/* Address lines */}
      <div className="flex items-start gap-2.5 mb-4">
        <MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="font-sans text-sm text-foreground leading-snug">{address.line1}</p>
          <p className="font-sans text-sm text-muted-foreground">
            {address.city}, {address.state} – {address.pincode}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {!address.isDefault && (
          <button
            onClick={onSetDefault}
            className="font-sans text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Set as default
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onEdit}
            aria-label="Edit address"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete address"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Address Form ───────────────────────────────────────────────────────────────

function AddressForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
      ...defaultValues,
    },
  });

  const stateValue = watch("state") ?? "";
  const cityValue = watch("city") ?? "";

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow";
  const labelClass = "block font-sans text-xs font-medium text-foreground mb-1.5";
  const errorClass = "font-sans text-xs text-destructive mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Label (optional) */}
      <div>
        <label className={labelClass}>
          Label <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          {...register("label")}
          placeholder="Home, Office, etc."
          className={inputClass}
        />
      </div>

      {/* Line 1 */}
      <div>
        <label className={labelClass}>
          Address Line 1 <span className="text-destructive">*</span>
        </label>
        <input
          {...register("line1")}
          placeholder="Flat / house no., street, area"
          className={inputClass}
          aria-invalid={!!errors.line1}
        />
        {errors.line1 && <p className={errorClass}>{errors.line1.message}</p>}
      </div>

      {/* City + State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            City <span className="text-destructive">*</span>
          </label>
          <CityCombobox
            value={cityValue}
            onChange={(val) => setValue("city", val, { shouldValidate: true })}
            error={errors.city?.message}
            inputClass={`${inputClass}${errors.city ? " border-red-500" : ""}`}
          />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>
        <div>
          <label className={labelClass}>
            State <span className="text-destructive">*</span>
          </label>
          <StateCombobox
            value={stateValue}
            onChange={(val) => setValue("state", val, { shouldValidate: true })}
            error={errors.state?.message}
            inputClass={`${inputClass}${errors.state ? " border-red-500" : ""}`}
          />
          {errors.state && <p className={errorClass}>{errors.state.message}</p>}
        </div>
      </div>

      {/* Pincode */}
      <div className="max-w-[180px]">
        <label className={labelClass}>
          Pincode <span className="text-destructive">*</span>
        </label>
        <input
          {...register("pincode")}
          placeholder="400001"
          maxLength={6}
          className={inputClass}
          aria-invalid={!!errors.pincode}
        />
        {errors.pincode && <p className={errorClass}>{errors.pincode.message}</p>}
      </div>

      {/* Set as default */}
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          {...register("isDefault")}
          className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
        />
        <span className="font-sans text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          Set as default address
        </span>
      </label>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors cursor-pointer"
        >
          {isSubmitting ? "Saving…" : "Save Address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-border text-foreground font-sans text-sm hover:bg-muted transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AddressManager({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxReached = addresses.length >= 5;

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleAdd(values: AddressFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: Address | { error: string } = await res.json();

      if (!res.ok) {
        toast.error((data as { error: string }).error ?? "Failed to add address");
        return;
      }

      const newAddress = data as Address;

      setAddresses((prev) => {
        const updated = values.isDefault
          ? prev.map((a) => ({ ...a, isDefault: false }))
          : prev;
        return [newAddress, ...updated].sort((a, b) =>
          a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1
        );
      });

      setIsAdding(false);
      toast.success("Address added");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(id: string, values: AddressFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: Address | { error: string } = await res.json();

      if (!res.ok) {
        toast.error((data as { error: string }).error ?? "Failed to update address");
        return;
      }

      const updated = data as Address;

      setAddresses((prev) => {
        let list = prev.map((a) => (a.id === id ? updated : a));
        if (values.isDefault) {
          list = list.map((a) =>
            a.id === id ? a : { ...a, isDefault: false }
          );
        }
        return list.sort((a, b) =>
          a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1
        );
      });

      setEditingId(null);
      toast.success("Address updated");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data: { error: string } = await res.json();
        toast.error(data.error ?? "Failed to delete address");
        return;
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address removed");
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!res.ok) {
        const data: { error: string } = await res.json();
        toast.error(data.error ?? "Failed to update default");
        return;
      }

      setAddresses((prev) =>
        prev
          .map((a) => ({ ...a, isDefault: a.id === id }))
          .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1))
      );
      toast.success("Default address updated");
    } catch {
      toast.error("Something went wrong");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const editingAddress = editingId
    ? addresses.find((a) => a.id === editingId)
    : null;

  return (
    <div className="space-y-6">
      {/* Address grid */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id}>
              <AddressCard
                address={address}
                onEdit={() => {
                  setIsAdding(false);
                  setEditingId(editingId === address.id ? null : address.id);
                }}
                onDelete={() => handleDelete(address.id)}
                onSetDefault={() => handleSetDefault(address.id)}
              />

              {/* Inline edit form — appears directly below the card being edited */}
              {editingId === address.id && editingAddress && (
                <div className="mt-3 rounded-xl border border-border bg-card p-5">
                  <p className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4">
                    Edit Address
                  </p>
                  <AddressForm
                    defaultValues={{
                      label: editingAddress.label ?? "",
                      line1: editingAddress.line1,
                      city: editingAddress.city,
                      state: editingAddress.state,
                      pincode: editingAddress.pincode,
                      isDefault: editingAddress.isDefault,
                    }}
                    onSubmit={(values) => handleEdit(address.id, values)}
                    onCancel={() => setEditingId(null)}
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <MapPinIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-sans text-sm text-muted-foreground">
            No saved addresses yet.
          </p>
        </div>
      )}

      {/* Add new address */}
      {!isAdding ? (
        <div>
          <button
            onClick={() => {
              if (!maxReached) {
                setEditingId(null);
                setIsAdding(true);
              }
            }}
            disabled={maxReached}
            title={maxReached ? "Maximum 5 addresses" : undefined}
            aria-disabled={maxReached}
            className={`inline-flex items-center gap-2 h-10 px-5 rounded-lg border font-sans text-sm transition-colors ${
              maxReached
                ? "border-border text-muted-foreground cursor-not-allowed opacity-50"
                : "border-primary/50 text-primary hover:bg-primary/5 cursor-pointer"
            }`}
          >
            <PlusIcon className="h-4 w-4" />
            Add new address
            {maxReached && (
              <span className="ml-1 text-xs text-muted-foreground">(limit reached)</span>
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4">
            New Address
          </p>
          <AddressForm
            onSubmit={handleAdd}
            onCancel={() => setIsAdding(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}
