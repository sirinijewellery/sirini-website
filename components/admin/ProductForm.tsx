"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Lock, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { getMaterials, parseImages } from "@/lib/parseImages";

// ---------- Types ----------
interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

interface ProductDB {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  material: string;
  sku: string;
  images: unknown;
  badge?: string | null;
  isFeatured: boolean;
  occasions: string[];
  tags: string[];
  compareAtPrice?: number | null;
  stock: number;
  displayOrder?: number | null;
  createdAt: Date;
}

const OCCASION_OPTIONS = [
  { slug: "bridal", label: "Bridal & Wedding" },
  { slug: "festive", label: "Festive Edit" },
] as const;

interface ProductFormProps {
  product?: ProductDB;
  categories: Category[];
}

// ---------- Zod schema ----------
const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number({ message: "Price must be a number" }).positive("Price must be positive"),
  compareAtPrice: z.number().int().positive().optional(),
  category: z.string().min(1, "Category is required"),
  material: z.string().min(1, "Material is required"),
  sku: z.string().min(1, "SKU is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  badge: z
    .enum(["", "NEW", "HOT", "SALE", "Handcrafted", "Traditional", "Bestseller"])
    .optional(),
  isFeatured: z.boolean(),
  occasions: z.array(z.string()),
  tags: z.array(z.string()),
  stock: z.number({ message: "Stock must be a number" }).int().min(0, "Stock must be 0 or more"),
  displayOrder: z.number().int().positive().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const MATERIALS = getMaterials();

function suggestCategoryFromSku(sku: string): string | null {
  const upper = sku.toUpperCase();
  if (upper.includes("LG")) return "Long Sets";
  if (upper.includes("NS") || upper.includes("NKS")) return "Necklace Sets";
  if (upper.includes("BG")) return "Bangles";
  if (upper.includes("FR")) return "Finger Rings";
  if (upper.includes("PL") || upper.includes("ANK")) return "Anklets";
  if (upper.includes("ER") || upper.includes("JHM")) return "Earrings";
  return null;
}

// ---------- Field wrapper ----------
function Field({
  label,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

// ---------- Main form ----------
export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [slugLocked, setSlugLocked] = useState(isEditing);

  // Guard flag so the beforeunload warning doesn't fire during the post-save redirect.
  const savedRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ?? undefined,
      compareAtPrice: product?.compareAtPrice ?? undefined,
      category: product?.category ?? "",
      material: product?.material ?? "",
      sku: product?.sku ?? "",
      images: parseImages(product?.images),
      badge:
        (product?.badge as
          | "NEW"
          | "HOT"
          | "SALE"
          | "Handcrafted"
          | "Traditional"
          | "Bestseller"
          | "") ?? "",
      isFeatured: product?.isFeatured ?? false,
      occasions: product?.occasions ?? [],
      tags: product?.tags ?? [],
      stock: product?.stock ?? 10,
      displayOrder: product?.displayOrder ?? undefined,
    },
  });

  const watchedImages = watch("images");
  const watchedPrice = watch("price");
  const watchedSku = watch("sku");

  // Warn on browser-level navigation (tab close / refresh) when there are unsaved edits.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !savedRef.current) {
        e.preventDefault();
        // Legacy browsers require returnValue to be set.
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function handleCancel() {
    if (isDirty && !savedRef.current) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them and leave?"
      );
      if (!confirmed) return;
    }
    savedRef.current = true;
    router.push("/admin/products");
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    register("name").onChange(e);
    if (!slugLocked) {
      setValue("slug", generateSlug(name), { shouldValidate: true });
    }
  }

  async function onSubmit(values: ProductFormValues) {
    const payload = {
      ...values,
      badge: values.badge || null,
      // Empty input → null so clearing the field unpins the product.
      displayOrder: values.displayOrder ?? null,
    };

    const url = isEditing
      ? `/api/admin/products/${product.id}`
      : "/api/admin/products";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Something went wrong");
        return;
      }

      // Mark as saved so the beforeunload guard stays quiet during the redirect.
      savedRef.current = true;
      toast.success(isEditing ? "Product updated" : "Product created");
      router.push("/admin/products");
    } catch {
      toast.error("Network error — please try again");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ── Section: Basic Info ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900 font-sans">Basic Information</h2>

        {/* Name */}
        <Field label="Product Name" required error={errors.name?.message} htmlFor="name">
          <Input
            id="name"
            placeholder="e.g. Kundan Jhumka Earrings"
            aria-invalid={!!errors.name}
            {...register("name")}
            onChange={handleNameChange}
          />
        </Field>

        {/* Slug */}
        <Field label="URL Slug" required error={errors.slug?.message} htmlFor="slug">
          <div className="flex gap-2">
            <Input
              id="slug"
              placeholder="e.g. kundan-jhumka-earrings"
              disabled={slugLocked}
              aria-invalid={!!errors.slug}
              {...register("slug")}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSlugLocked((prev) => !prev)}
              className="shrink-0 gap-1.5"
              aria-label={slugLocked ? "Unlock slug for editing" : "Lock slug"}
            >
              {slugLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Edit
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Lock
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Used in the product URL. Auto-generated from name when unlocked.
          </p>
        </Field>

        {/* Description */}
        <Field label="Description" required error={errors.description?.message} htmlFor="description">
          <Textarea
            id="description"
            placeholder="Describe the product — material, occasion, style…"
            rows={4}
            aria-invalid={!!errors.description}
            {...register("description")}
          />
        </Field>
      </section>

      {/* ── Section: Pricing & Identity ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900 font-sans">Pricing & Identity</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Price */}
          <Field label="Price (INR)" required error={errors.price?.message} htmlFor="price">
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                ₹
              </span>
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                aria-invalid={!!errors.price}
                className="pl-6"
                {...register("price", { valueAsNumber: true })}
              />
            </div>
          </Field>

          {/* Compare-at Price */}
          <Field label="Compare-at Price (MRP)" error={errors.compareAtPrice?.message} htmlFor="compareAtPrice">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <Input
                  id="compareAtPrice"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Auto: 2× price"
                  className="pl-6"
                  {...register("compareAtPrice", { valueAsNumber: true })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (watchedPrice && watchedPrice > 0) {
                    setValue("compareAtPrice", Math.round(watchedPrice * 2), { shouldValidate: true });
                  }
                }}
                className="shrink-0 gap-1.5 text-xs"
                title="Set to 2× selling price"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Auto
              </Button>
            </div>
            <p className="text-xs text-gray-400">Struck-through &quot;original&quot; price shown on the site. Auto = 2× selling price.</p>
          </Field>

          {/* SKU */}
          <Field label="SKU" required error={errors.sku?.message} htmlFor="sku">
            <div className="flex gap-2">
              <Input
                id="sku"
                placeholder="e.g. SRN-EAR-001"
                aria-invalid={!!errors.sku}
                {...register("sku")}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const suggested = suggestCategoryFromSku(watchedSku ?? "");
                  if (suggested) setValue("category", suggested, { shouldValidate: true });
                }}
                className="shrink-0 text-xs gap-1.5"
                title="Auto-detect category from SKU"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Auto
              </Button>
            </div>
          </Field>

          {/* Category */}
          <Field label="Category" required error={errors.category?.message} htmlFor="category">
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="category"
                    aria-invalid={!!errors.category}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Material */}
          <Field label="Material" required error={errors.material?.message} htmlFor="material">
            <Controller
              control={control}
              name="material"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="material"
                    aria-invalid={!!errors.material}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((mat) => (
                      <SelectItem key={mat} value={mat}>
                        {mat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Merchandising ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900 font-sans">Merchandising</h2>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Badge */}
          <Field label="Badge" error={errors.badge?.message} htmlFor="badge">
            <Controller
              control={control}
              name="badge"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="badge" className="w-40">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="NEW">NEW</SelectItem>
                    <SelectItem value="HOT">HOT</SelectItem>
                    <SelectItem value="SALE">SALE</SelectItem>
                    <SelectItem value="Handcrafted">Handcrafted</SelectItem>
                    <SelectItem value="Traditional">Traditional</SelectItem>
                    <SelectItem value="Bestseller">Bestseller</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Front-page position */}
          <Field
            label="Front-page position"
            error={errors.displayOrder?.message}
            htmlFor="displayOrder"
          >
            <Input
              id="displayOrder"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 1"
              className="w-40"
              aria-invalid={!!errors.displayOrder}
              {...register("displayOrder", {
                // Empty input → undefined (not NaN) so "unpinned" validates.
                setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
              })}
            />
            <p className="text-xs text-gray-400">
              1 = first product on the shop page. Leave empty for automatic order.
            </p>
          </Field>

          {/* isFeatured */}
          <div className="flex items-center gap-3 pt-6">
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}
            />
            <Label htmlFor="isFeatured" className="cursor-pointer text-sm text-gray-700">
              Featured product
            </Label>
          </div>
        </div>

        {/* Occasions */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">Occasions</legend>
          <p className="text-xs text-gray-400">
            Tag this product for occasion collections shown on the site.
          </p>
          <Controller
            control={control}
            name="occasions"
            render={({ field }) => (
              <div className="flex flex-col sm:flex-row gap-x-6 gap-y-3 pt-1">
                {OCCASION_OPTIONS.map((opt) => {
                  const checked = field.value.includes(opt.slug);
                  return (
                    <div key={opt.slug} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`occasion-${opt.slug}`}
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, opt.slug]);
                          } else {
                            field.onChange(field.value.filter((s) => s !== opt.slug));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Label
                        htmlFor={`occasion-${opt.slug}`}
                        className="cursor-pointer text-sm text-gray-700"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          />
        </fieldset>

        {/* Tags */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">Tags</legend>
          <p className="text-xs text-gray-400">
            These appear as collection labels on product cards and filter pages.
          </p>
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <div className="flex flex-col sm:flex-row gap-x-6 gap-y-3 pt-1">
                {[
                  { slug: "handpicked", label: "Handpicked" },
                  { slug: "bestsellers", label: "Bestsellers" },
                  { slug: "new-arrivals", label: "New Arrivals" },
                ].map((opt) => {
                  const checked = field.value.includes(opt.slug);
                  return (
                    <div key={opt.slug} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`tag-${opt.slug}`}
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, opt.slug]);
                          } else {
                            field.onChange(field.value.filter((s) => s !== opt.slug));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Label htmlFor={`tag-${opt.slug}`} className="cursor-pointer text-sm text-gray-700">
                        {opt.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          />
        </fieldset>
      </section>

      {/* ── Section: Images ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 font-sans">Images</h2>
        <ImageUploader
          images={watchedImages}
          onChange={(urls) => setValue("images", urls, { shouldValidate: true })}
        />
        {errors.images && (
          <p className="text-xs font-medium text-destructive">{errors.images.message}</p>
        )}
      </section>

      {/* ── Section: Inventory ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900 font-sans">Inventory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Stock quantity" required error={errors.stock?.message} htmlFor="stock">
            <Input
              id="stock"
              type="number"
              min={0}
              step={1}
              placeholder="10"
              aria-invalid={!!errors.stock}
              {...register("stock", { valueAsNumber: true })}
            />
            <p className="text-xs text-gray-400">
              Total units available for sale. Set to 0 to mark out of stock.
            </p>
          </Field>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting
            ? isEditing ? "Saving…" : "Creating…"
            : isEditing ? "Save Changes" : "Create Product"}
        </Button>
      </div>

      {/* ── Sticky unsaved-changes bar ── */}
      {isDirty && !savedRef.current && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
              You have unsaved changes
            </p>
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting
                ? isEditing ? "Saving…" : "Creating…"
                : "Save product"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
