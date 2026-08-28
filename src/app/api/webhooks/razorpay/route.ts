import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { OrderWithItems } from "@/lib/types";

// Server-side backstop in case the browser never returns to /checkout/verify.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    payload: {
      payment: {
        entity: { id: string; order_id: string };
      };
    };
  };

  const admin = createAdminClient();
  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return NextResponse.json({ ok: true });

  const { data: order } = await admin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (!order) return NextResponse.json({ ok: true });

  if (event.event === "payment.captured" && order.status === "pending") {
    await admin.rpc("mark_order_paid", {
      p_order_id: order.id,
      p_payment_id: payment.id,
      p_signature: "webhook",
    });
    await sendOrderConfirmationEmail(order as unknown as OrderWithItems);
  } else if (
    event.event === "payment.failed" &&
    order.status === "pending"
  ) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
  }

  return NextResponse.json({ ok: true });
}
