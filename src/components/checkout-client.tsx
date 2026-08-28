"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressForm } from "@/components/address-form";
import { OrderSummary } from "@/components/order-summary";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { formatINR } from "@/lib/format";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Address } from "@/lib/types";

interface Line {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

export function CheckoutClient({
  addresses,
  lines,
  subtotal,
  customer,
}: {
  addresses: Address[];
  lines: Line[];
  subtotal: number;
  customer: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useCart();

  const [selectedId, setSelectedId] = useState<string | null>(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null,
  );
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [paying, setPaying] = useState(false);

  async function pay() {
    if (!selectedId) {
      toast("Please choose a shipping address.", "error");
      return;
    }
    if (typeof window === "undefined" || !window.Razorpay) {
      toast("Payment library is still loading — try again in a moment.", "error");
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not start checkout.", "error");
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: BRAND,
        description: `Order ${data.orderId.slice(0, 8)}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: { color: "#e11d2a" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast("Payment cancelled.", "info");
          },
        },
        handler: async (response) => {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            await refresh();
            router.push(`/checkout/success?order=${data.orderId}`);
          } else {
            const v = await verifyRes.json().catch(() => ({}));
            toast(v.error ?? "Payment could not be verified.", "error");
            router.push(`/account/orders/${data.orderId}`);
          }
        },
      });
      rzp.open();
    } catch {
      toast("Something went wrong. Please try again.", "error");
      setPaying(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold">Shipping address</h2>
          <div className="mt-4 space-y-3">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-4 text-sm",
                  selectedId === a.id
                    ? "border-brand bg-brand-subtle"
                    : "border-border hover:bg-subtle",
                )}
              >
                <input
                  type="radio"
                  name="address"
                  className="mt-0.5 size-4 accent-brand"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                />
                <span>
                  <span className="font-medium">
                    {a.label || a.full_name}
                    {a.is_default ? " · Default" : ""}
                  </span>
                  <br />
                  <span className="text-muted">
                    {a.full_name}, {a.phone}
                    <br />
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state}{" "}
                    {a.postal_code}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {addingAddress ? (
            <div className="mt-4">
              <AddressForm
                onSaved={(id) => {
                  setAddingAddress(false);
                  setSelectedId(id);
                  router.refresh();
                }}
                onCancel={
                  addresses.length
                    ? () => setAddingAddress(false)
                    : undefined
                }
              />
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setAddingAddress(true)}
            >
              Add a new address
            </Button>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold">Items</h2>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
            {lines.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-4 p-4 text-sm"
              >
                <span>
                  {l.name}{" "}
                  <span className="text-muted">
                    · {l.size} · Qty {l.quantity}
                  </span>
                </span>
                <span className="font-semibold">
                  {formatINR(l.price * l.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="h-fit">
        <OrderSummary subtotal={subtotal}>
          <Button
            size="lg"
            className="w-full"
            onClick={pay}
            disabled={paying || !selectedId}
          >
            {paying && <Spinner />}
            Pay with Razorpay
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            You&apos;ll complete payment in a secure Razorpay window.
          </p>
        </OrderSummary>
      </div>
    </div>
  );
}
