import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { OrderDetail } from "@/components/order-detail";
import { buttonClasses } from "@/components/ui/button";
import type { OrderWithItems } from "@/lib/types";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  await requireUser("/account/orders");
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/account/orders");

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .maybeSingle();

  if (!data) redirect("/account/orders");
  const order = data as unknown as OrderWithItems;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="size-12 text-success" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {order.status === "paid" ? "Order confirmed" : "Order received"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {order.status === "paid"
            ? "We've emailed your confirmation. Thanks for shopping with shoe-vault!"
            : "Your payment is being confirmed. This page will show the final status shortly."}
        </p>
      </div>

      <div className="mt-10">
        <OrderDetail order={order} />
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/account/orders"
          className={buttonClasses({ variant: "outline" })}
        >
          View all orders
        </Link>
        <Link href="/products" className={buttonClasses({})}>
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
