import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderDetail } from "@/components/order-detail";
import type { OrderWithItems } from "@/lib/types";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div>
      <Link
        href="/account/orders"
        className="text-sm text-muted hover:text-foreground"
      >
        ← All orders
      </Link>
      <div className="mt-4">
        <OrderDetail order={data as unknown as OrderWithItems} />
      </div>
    </div>
  );
}
