"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { removeCartItem, updateCartItem } from "@/actions/cart";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast";
import { formatINR } from "@/lib/format";
import type { CartLine } from "@/lib/types";

export function CartLineRow({ line }: { line: CartLine }) {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useCart();
  const [pending, startTransition] = useTransition();

  const product = line.variant.product;
  const image = product.images?.[0];
  const stock = line.variant.stock_quantity;

  function change(nextQty: number) {
    startTransition(async () => {
      const res = await updateCartItem({ itemId: line.id, quantity: nextQty });
      if (!res.ok) toast(res.error, "error");
      await refresh();
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItem(line.id);
      await refresh();
      router.refresh();
    });
  }

  return (
    <div className="flex gap-4 py-4" data-pending={pending}>
      <Link
        href={`/products/${product.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-subtle"
      >
        {image?.url && (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div>
            <Link
              href={`/products/${product.slug}`}
              className="text-sm font-medium hover:underline"
            >
              {product.name}
            </Link>
            <p className="text-xs text-muted">Size {line.variant.size}</p>
          </div>
          <p className="text-sm font-semibold">
            {formatINR(product.price * line.quantity)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="inline-flex items-center rounded-lg border border-border">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center disabled:opacity-40"
              onClick={() => change(line.quantity - 1)}
              disabled={pending}
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-9 text-center text-sm">{line.quantity}</span>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center disabled:opacity-40"
              onClick={() => change(line.quantity + 1)}
              disabled={pending || line.quantity >= stock}
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand"
          >
            <Trash2 className="size-4" /> Remove
          </button>
        </div>
        {line.quantity >= stock && (
          <p className="mt-1 text-xs text-warning">
            Max available: {stock}
          </p>
        )}
      </div>
    </div>
  );
}
