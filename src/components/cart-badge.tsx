"use client";

import { useCart } from "@/components/cart-provider";

export function CartBadge() {
  const { count } = useCart();
  if (count <= 0) return null;
  return (
    <span className="absolute right-0 top-0 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
