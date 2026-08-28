"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { upsertProduct, deleteProduct } from "@/actions/admin";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";
import { SIZES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { Category, ProductVariant } from "@/lib/types";

interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  category_id: string;
  description: string;
  price: number;
  is_featured: boolean;
  is_active: boolean;
  variants: Pick<ProductVariant, "size" | "stock_quantity">[];
}

export function ProductForm({
  categories,
  product,
}: {
  categories: Pick<Category, "id" | "name">[];
  product?: ProductFormData;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));

  const initialStock = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    for (const v of product?.variants ?? []) map[v.size] = v.stock_quantity;
    return map;
  }, [product]);

  const [stock, setStock] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    for (const size of SIZES)
      s[size] =
        initialStock[size] !== undefined ? String(initialStock[size]) : "";
    return s;
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const variants = SIZES.filter((s) => stock[s] !== "").map((s) => ({
      size: s,
      stock_quantity: Number(stock[s] || 0),
    }));

    const payload = {
      id: product?.id,
      name: String(fd.get("name") ?? ""),
      slug: String(fd.get("slug") ?? ""),
      category_id: String(fd.get("category_id") ?? ""),
      description: String(fd.get("description") ?? ""),
      price: Number(fd.get("price") ?? 0),
      is_featured: fd.get("is_featured") === "on",
      is_active: fd.get("is_active") === "on",
      variants,
    };

    startTransition(async () => {
      const res = await upsertProduct(payload);
      if (res.ok) {
        toast("Product saved.", "success");
        router.push(`/admin/products/${res.id}`);
        router.refresh();
      } else {
        setError(res.error);
        toast(res.error, "error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            required
          >
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="1"
            defaultValue={product?.price ?? ""}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          rows={4}
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product?.is_active ?? true}
            className="size-4 accent-brand"
          />
          Active (visible in store)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product?.is_featured ?? false}
            className="size-4 accent-brand"
          />
          Featured on homepage
        </label>
      </div>

      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Sizes &amp; stock</legend>
        <p className="mb-3 text-xs text-muted">
          Leave a field blank to not offer that size.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SIZES.map((size) => (
            <div key={size}>
              <Label htmlFor={`stock-${size}`} className="text-xs">
                {size}
              </Label>
              <Input
                id={`stock-${size}`}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="—"
                value={stock[size]}
                onChange={(e) =>
                  setStock((s) => ({ ...s, [size]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      </fieldset>

      <FieldError>{error}</FieldError>

      <div className="flex items-center justify-between">
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {product ? "Save changes" : "Create product"}
        </Button>

        {product && (
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            onClick={() => {
              if (!confirm("Delete this product? This cannot be undone.")) return;
              startDelete(async () => {
                const res = await deleteProduct(product.id!);
                if (res.ok) {
                  toast("Product deleted.", "success");
                  router.push("/admin");
                  router.refresh();
                } else {
                  toast(res.error, "error");
                }
              });
            }}
          >
            {deleting && <Spinner />}
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
