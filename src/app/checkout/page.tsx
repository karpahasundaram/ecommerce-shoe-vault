import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, requireUser } from "@/lib/auth";
import { getCart, cartTotals } from "@/lib/queries";
import { CheckoutClient } from "@/components/checkout-client";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const supabase = await createClient();

  const [lines, profile, { data: addresses }] = await Promise.all([
    getCart(),
    getProfile(),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (lines.length === 0) redirect("/cart");

  const { subtotal } = cartTotals(lines);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
      <div className="mt-8">
        <CheckoutClient
          addresses={(addresses ?? []) as Address[]}
          lines={lines.map((l) => ({
            id: l.id,
            name: l.variant.product.name,
            size: l.variant.size,
            quantity: l.quantity,
            price: l.variant.product.price,
          }))}
          subtotal={subtotal}
          customer={{
            name: profile?.full_name ?? "",
            email: user.email ?? "",
            phone: profile?.phone ?? "",
          }}
        />
      </div>
    </div>
  );
}
