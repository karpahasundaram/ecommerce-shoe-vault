import Image from "next/image";
import { formatINR, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import type { OrderWithItems } from "@/lib/types";

export function OrderDetail({ order }: { order: OrderWithItems }) {
  const addr = order.shipping_address;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Order #{order.order_no}</h2>
          <p className="text-sm text-muted">
            Placed {formatDate(order.created_at)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-4 p-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-subtle">
              {i.image_url && (
                <Image
                  src={i.image_url}
                  alt={i.product_name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{i.product_name}</p>
              <p className="text-muted">
                Size {i.size} · Qty {i.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold">
              {formatINR(i.unit_price * i.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4 text-sm">
          <h3 className="font-semibold">Shipping to</h3>
          <p className="mt-2 text-muted">
            {addr.full_name}, {addr.phone}
            <br />
            {addr.line1}
            {addr.line2 ? `, ${addr.line2}` : ""}
            <br />
            {addr.city}, {addr.state} {addr.postal_code}, {addr.country}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4 text-sm">
          <h3 className="font-semibold">Payment</h3>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatINR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>
                {order.shipping_fee === 0
                  ? "Free"
                  : formatINR(order.shipping_fee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <dt>Total</dt>
              <dd>{formatINR(order.total)}</dd>
            </div>
          </dl>
          {order.razorpay_payment_id && (
            <p className="mt-3 text-xs text-muted">
              Razorpay payment ID: {order.razorpay_payment_id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
