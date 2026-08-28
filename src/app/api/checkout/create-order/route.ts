import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRazorpayOrder, RazorpayConfigError } from "@/lib/razorpay";
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
    console.error("[checkout] create_order_from_cart failed:", error);
    return NextResponse.json(
      {
        error:
          error?.code === "PGRST202"
            ? "Checkout function is missing — run supabase/schema.sql in the Supabase SQL editor."
            : (error?.message ?? "Could not create the order"),
      },
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
    const admin = createAdminClient();
    await admin.from("orders").update({ status: "failed" }).eq("id", orderId);

    if (err instanceof RazorpayConfigError) {
      console.error("[checkout] Razorpay misconfigured:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Surface the real Razorpay API error (status + description) to the logs.
    const e = err as {
      statusCode?: number;
      error?: { description?: string; code?: string };
      message?: string;
    };
    const detail =
      e?.error?.description ?? e?.message ?? "unknown error";
    console.error(
      `[checkout] Razorpay order creation failed (status ${e?.statusCode ?? "?"}): ${detail}`,
    );

    const isAuth =
      e?.statusCode === 401 || /authentica/i.test(detail);
    return NextResponse.json(
      {
        error: isAuth
          ? "Razorpay rejected the API key. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server (they must be a matching pair from Razorpay → Settings → API Keys)."
          : `Payment gateway error: ${detail}`,
      },
      { status: 502 },
    );
  }
}
