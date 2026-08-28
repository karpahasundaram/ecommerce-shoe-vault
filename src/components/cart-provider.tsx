"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface CartSummary {
  count: number;
  subtotal: number;
}

const CartContext = createContext<{
  count: number;
  subtotal: number;
  refresh: () => Promise<void>;
} | null>(null);

export function CartProvider({
  initial,
  children,
}: {
  initial: CartSummary;
  children: React.ReactNode;
}) {
  const [summary, setSummary] = useState<CartSummary>(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart/summary", { cache: "no-store" });
      if (res.ok) setSummary(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // Re-sync when the tab regains focus (e.g. after checkout in another view)
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <CartContext.Provider
      value={{ count: summary.count, subtotal: summary.subtotal, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
