import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { serverEnv } from "@/lib/env";

/** Thrown when the Razorpay env vars are obviously wrong (before we call the API). */
export class RazorpayConfigError extends Error {}

/**
 * Catch the most common misconfiguration: pasting the Key ID into BOTH
 * RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET. A real key secret is a ~24-char
 * string with NO `rzp_` prefix; the Key ID always starts with `rzp_`.
 */
export function assertRazorpayConfig() {
  const id = serverEnv.razorpayKeyId;
  const secret = serverEnv.razorpayKeySecret;

  if (!id.startsWith("rzp_")) {
    throw new RazorpayConfigError(
      "RAZORPAY_KEY_ID is invalid — it must start with `rzp_test_` or `rzp_live_`. " +
        "Copy the Key Id from Razorpay Dashboard → Settings → API Keys.",
    );
  }
  if (secret.startsWith("rzp_") || /^x+$/i.test(secret) || secret.includes("your-")) {
    throw new RazorpayConfigError(
      "RAZORPAY_KEY_SECRET is wrong — it looks like a Key Id or a placeholder. " +
        "The Key Secret is the separate ~24-character value shown only once when you " +
        "generated the key (Razorpay Dashboard → Settings → API Keys). It has no `rzp_` prefix.",
    );
  }
}

let _client: Razorpay | null = null;

function client(): Razorpay {
  if (!_client) {
    assertRazorpayConfig();
    _client = new Razorpay({
      key_id: serverEnv.razorpayKeyId,
      key_secret: serverEnv.razorpayKeySecret,
    });
  }
  return _client;
}

/** Create a Razorpay order. `amountPaise` must be an integer in paise. */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return client().orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
}

/**
 * Verify the signature returned by Razorpay Checkout to the browser.
 * signature === HMAC_SHA256(`${orderId}|${paymentId}`, key_secret)
 */
export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", serverEnv.razorpayKeySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, input.signature);
}

/**
 * Verify a Razorpay webhook delivery.
 * signature === HMAC_SHA256(rawBody, webhook_secret)
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", serverEnv.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
