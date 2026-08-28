"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { addToCart } from "@/actions/cart";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

interface VariantOption {
  id: string;
  size: string;
  stock_quantity: number;
}

export function AddToCart({
  variants,
  signedIn,
}: {
  variants: VariantOption[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useCart();
  const [pending, startTransition] = useTransition();

  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const selected = variants.find((v) => v.id === variantId) ?? null;
  const maxQty = selected?.stock_quantity ?? 1;

  function submit() {
    if (!signedIn) {
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    if (!variantId) {
      toast("Please choose a size.", "error");
      return;
    }
    startTransition(async () => {
      const res = await addToCart({ variantId, quantity: qty });
      if (res.ok) {
        toast("Added to cart.", "success");
        await refresh();
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Size</span>
          <span className="text-xs text-muted">UK sizing</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {variants.map((v) => {
            const disabled = v.stock_quantity === 0;
            return (
              <button
                key={v.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                className={cn(
                  "h-11 rounded-lg border text-sm transition-colors",
                  disabled &&
                    "cursor-not-allowed border-border text-muted line-through opacity-60",
                  !disabled &&
                    v.id === variantId &&
                    "border-brand bg-brand-subtle font-medium text-brand",
                  !disabled &&
                    v.id !== variantId &&
                    "border-border hover:bg-subtle",
                )}
              >
                {v.size.replace("UK ", "")}
              </button>
            );
          })}
        </div>
        {selected && selected.stock_quantity <= 5 && (
          <p className="mt-2 text-xs text-warning">
            Only {selected.stock_quantity} left in this size.
          </p>
        )}
      </div>

      <div>
        <span className="text-sm font-medium">Quantity</span>
        <div className="mt-2 inline-flex items-center rounded-lg border border-border">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={!selected || qty >= maxQty}
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <Button
        size="lg"
        onClick={submit}
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {pending && <Spinner />}
        {signedIn ? "Add to cart" : "Log in to add to cart"}
      </Button>
    </div>
  );
}
