"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SIZES, SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CatalogControls({ basePath }: { basePath: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const sort = params.get("sort") ?? "newest";
  const size = params.get("size") ?? "";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";

  const activeCount =
    (size ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    startTransition(() => {
      router.push(sp.toString() ? `${basePath}?${sp}` : basePath, {
        scroll: false,
      });
    });
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-subtle"
        aria-expanded={open}
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 rounded-full bg-brand px-1.5 text-xs text-brand-foreground">
            {activeCount}
          </span>
        )}
      </button>

      <label className="ml-auto flex items-center gap-2 text-sm">
        <span className="text-muted">Sort</span>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="h-10 cursor-pointer rounded-lg border border-border bg-white px-2 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {open && (
        <div className="w-full rounded-lg border border-border bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filter</h3>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  update({ size: null, minPrice: null, maxPrice: null })
                }
                className="inline-flex items-center gap-1 text-xs text-brand"
              >
                <X className="size-3" /> Clear all
              </button>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Available in size
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update({ size: size === s ? null : s })}
                  className={cn(
                    "h-9 rounded-lg border px-3 text-sm",
                    size === s
                      ? "border-brand bg-brand-subtle text-brand"
                      : "border-border hover:bg-subtle",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Price (₹)
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Min"
                defaultValue={minPrice}
                onBlur={(e) => update({ minPrice: e.target.value })}
                className="h-10 w-28 rounded-lg border border-border px-3 text-sm"
              />
              <span className="text-muted">–</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Max"
                defaultValue={maxPrice}
                onBlur={(e) => update({ maxPrice: e.target.value })}
                className="h-10 w-28 rounded-lg border border-border px-3 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {isPending && <span className="sr-only">Updating results…</span>}
    </div>
  );
}
