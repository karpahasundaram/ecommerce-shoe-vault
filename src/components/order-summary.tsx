import { formatINR } from "@/lib/format";
import { shippingFor, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export function OrderSummary({
  subtotal,
  children,
}: {
  subtotal: number;
  children?: React.ReactNode;
}) {
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h2 className="text-sm font-semibold">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatINR(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatINR(total)}</dd>
        </div>
      </dl>
      {remaining > 0 && (
        <p className="mt-3 text-xs text-muted">
          Add {formatINR(remaining)} more for free shipping.
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
