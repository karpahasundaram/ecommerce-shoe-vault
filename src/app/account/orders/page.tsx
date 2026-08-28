import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { EmptyState } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_no, status, total, created_at, order_items(id)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Order history</h2>
        <div className="mt-6">
          <EmptyState
            title="No orders yet"
            description="When you place an order it'll show up here."
            action={
              <Link href="/products" className={buttonClasses({ size: "md" })}>
                Start shopping
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Order history</h2>
      <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
        {orders.map((o) => {
          const count = (o.order_items as unknown as { id: string }[]).length;
          return (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-subtle"
              >
                <div>
                  <p className="text-sm font-medium">Order #{o.order_no}</p>
                  <p className="text-xs text-muted">
                    {formatDate(o.created_at)} · {count}{" "}
                    {count === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={o.status} />
                  <span className="text-sm font-semibold">
                    {formatINR(o.total)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
