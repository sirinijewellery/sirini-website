"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Lock } from "lucide-react";

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
import { VariantManager, type Variant } from "@/components/admin/VariantManager";
import { getMaterials, parseImages } from "@/lib/parseImages";

// ---------- Types ----------
interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

interface ProductVariantDB {
  id: string;
  productId: string;
  size?: string | null;
  colour?: string | null;
  stockQuantity: number;
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
  createdAt: Date;
  variants: ProductVariantDB[];
}

interface ProductFormProps {
  product?: ProductDB;
  categories: Category[];
}

// ---------- Zod schema ----------
const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().optional(),
  colour: z.string().optional(),
  stockQuantity: z.number().int().min(0, "Stock must be 0 or more"),
});

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number({ message: "Price must be a number" }).positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  material: z.string().min(1, "Material is required"),
  sku: z.string().min(1, "SKU is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  badge: z.enum(["", "NEW", "HOT", "SALE"]).optional(),
  isFeatured: z.boolean(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const MATERIALS = getMaterials();

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

  const defaultVariants: Variant[] = product?.variants.map((v) => ({
    id: v.id,
    size: v.size ?? "",
    colour: v.colour ?? "",
    stockQuantity: v.stockQuantity,
  })) ?? [{ size: "", colour: "", stockQuantity: 0 }];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ?? undefined,
      category: product?.category ?? "",
      material: product?.material ?? "",
      sku: product?.sku ?? "",
      images: parseImages(product?.images),
      badge: (product?.badge as "NEW" | "HOT" | "SALE" | "") ?? "",
      isFeatured: product?.isFeatured ?? false,
      variants: defaultVariants,
    },
  });

  const watchedImages = watch("images");
  const watchedVariants = watch("variants");

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

          {/* SKU */}
          <Field label="SKU" required error={errors.sku?.message} htmlFor="sku">
            <Input
              id="sku"
              placeholder="e.g. SRN-EAR-001"
              aria-invalid={!!errors.sku}
              {...register("sku")}
            />
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
                  </SelectContent>
                </Select>
              )}
            />
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

      {/* ── Section: Variants ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 font-sans">Variants</h2>
          <span className="text-xs text-gray-400">{watchedVariants.length} variant{watchedVariants.length !== 1 ? "s" : ""}</span>
        </div>
        <p className="text-xs text-gray-500">
          Each variant can have an optional size, colour, and a stock count. At least one variant is required.
        </p>
        <VariantManager
          variants={watchedVariants as Variant[]}
          onChange={(v) => setValue("variants", v, { shouldValidate: true })}
          error={errors.variants?.message as string | undefined}
        />
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
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
    </form>
  );
}
