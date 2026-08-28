import "server-only";
import { Resend } from "resend";
import { serverEnv, env } from "@/lib/env";
import { formatINR } from "@/lib/format";
import { BRAND } from "@/lib/constants";
import type { OrderWithItems } from "@/lib/types";

let _resend: Resend | null = null;
function resend(): Resend {
  if (!_resend) _resend = new Resend(serverEnv.resendApiKey);
  return _resend;
}

export async function sendOrderConfirmationEmail(order: OrderWithItems) {
  const addr = order.shipping_address;
  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${i.product_name} &middot; ${i.size} &times; ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatINR(
          i.unit_price * i.quantity,
        )}</td>
      </tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#141414">
    <h1 style="font-size:20px">Thanks for your order, ${addr.full_name.split(" ")[0]}!</h1>
    <p style="color:#555">Order <strong>#${order.order_no}</strong> is confirmed and being processed.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${rows}
      <tr><td style="padding:8px 0">Subtotal</td><td style="padding:8px 0;text-align:right">${formatINR(order.subtotal)}</td></tr>
      <tr><td style="padding:8px 0">Shipping</td><td style="padding:8px 0;text-align:right">${
        order.shipping_fee === 0 ? "Free" : formatINR(order.shipping_fee)
      }</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold">${formatINR(
        order.total,
      )}</td></tr>
    </table>
    <p style="color:#555;font-size:14px">
      Shipping to:<br/>
      ${addr.full_name}, ${addr.phone}<br/>
      ${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}<br/>
      ${addr.city}, ${addr.state} ${addr.postal_code}, ${addr.country}
    </p>
    <p style="margin-top:24px">
      <a href="${env.siteUrl}/account/orders/${order.id}"
         style="background:#e11d2a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">
        View your order
      </a>
    </p>
    <p style="color:#999;font-size:12px;margin-top:32px">${BRAND}</p>
  </div>`;

  try {
    await resend().emails.send({
      from: serverEnv.emailFrom,
      to: order.email,
      subject: `${BRAND} — order #${order.order_no} confirmed`,
      html,
    });
  } catch (err) {
    // Never fail the payment flow because an email couldn't be sent.
    console.error("Failed to send order confirmation email", err);
  }
}
