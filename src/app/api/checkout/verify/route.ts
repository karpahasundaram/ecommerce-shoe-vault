import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { OrderWithItems } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    orderId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    body;
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status, razorpay_order_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.razorpay_order_id !== razorpayOrderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  const valid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!valid) {
    await admin.from("orders").update({ status: "failed" }).eq("id", orderId);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 400 },
    );
  }

  const { error: rpcError } = await admin.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_payment_id: razorpayPaymentId,
    p_signature: razorpaySignature,
  });
  if (rpcError) {
    console.error("mark_order_paid failed", rpcError);
    return NextResponse.json(
      { error: "Could not finalise the order" },
      { status: 500 },
    );
  }

  // Send confirmation email (best-effort; never blocks the response outcome).
  if (order.status === "pending") {
    const { data: full } = await admin
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", orderId)
      .single();
    if (full) await sendOrderConfirmationEmail(full as unknown as OrderWithItems);
  }

  return NextResponse.json({ ok: true, orderId });
}
