import { Badge } from "@/components/ui/misc";
import type { OrderStatus } from "@/lib/types";

const map: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "brand" | "success" | "warning" }
> = {
  pending: { label: "Payment pending", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Payment failed", tone: "brand" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  shipped: { label: "Shipped", tone: "success" },
  delivered: { label: "Delivered", tone: "success" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = map[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
