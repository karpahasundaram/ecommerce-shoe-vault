import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getCart, cartTotals } from "@/lib/queries";
import { CartLineRow } from "@/components/cart-line-row";
import { OrderSummary } from "@/components/order-summary";
import { EmptyState } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await getUser();
  const lines = user ? await getCart() : [];
  const { subtotal } = cartTotals(lines);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Your cart</h1>

      {!user ? (
        <div className="mt-8">
          <EmptyState
            title="Log in to view your cart"
            description="Your cart is saved to your account so it's here on every device."
            action={
              <Link
                href="/login?redirect=/cart"
                className={buttonClasses({ size: "md" })}
              >
                Log in
              </Link>
            }
          />
        </div>
      ) : lines.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Find your next pair."
            action={
              <Link href="/products" className={buttonClasses({ size: "md" })}>
                Browse shoes
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="divide-y divide-border">
            {lines.map((line) => (
              <CartLineRow key={line.id} line={line} />
            ))}
          </div>
          <div className="h-fit">
            <OrderSummary subtotal={subtotal}>
              <Link
                href="/checkout"
                className={buttonClasses({ size: "lg", className: "w-full" })}
              >
                Proceed to checkout
              </Link>
            </OrderSummary>
          </div>
        </div>
      )}
    </div>
  );
}
