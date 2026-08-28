import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRazorpayOrder } from "@/lib/razorpay";
import { toPaise } from "@/lib/format";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let addressId: string;
  try {
    const body = await request.json();
    addressId = String(body.addressId ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!addressId) {
    return NextResponse.json(
      { error: "Choose a shipping address" },
      { status: 400 },
    );
  }

  // Build the pending order + recompute totals server-side (SECURITY DEFINER).
  const { data, error } = await supabase.rpc("create_order_from_cart", {
    p_address_id: addressId,
    p_email: user.email ?? "",
  });

  if (error || !data || data.length === 0) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create the order" },
      { status: 400 },
    );
  }

  const { order_id: orderId, total } = data[0];

  try {
    const rzpOrder = await createRazorpayOrder({
      amountPaise: toPaise(Number(total)),
      receipt: orderId,
      notes: { order_id: orderId, user_id: user.id },
    });

    // orders has no client-side UPDATE policy — use the service role client.
    const admin = createAdminClient();
    await admin
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", orderId);

    return NextResponse.json({
      orderId,
      razorpayOrderId: rzpOrder.id,
      amount: Number(rzpOrder.amount),
      currency: rzpOrder.currency ?? "INR",
      keyId: env.razorpayKeyId,
    });
  } catch (err) {
    console.error("Razorpay order creation failed", err);
    const admin = createAdminClient();
    await admin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    return NextResponse.json(
      { error: "Payment gateway error. Please try again." },
      { status: 502 },
    );
  }
}
