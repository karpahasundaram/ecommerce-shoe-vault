// Centralised environment-variable access with friendly errors.
// Public vars (NEXT_PUBLIC_*) are inlined by Next at build time.

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing environment variable: ${name}. See SETUP.md and add it to .env.local`,
    );
  }
  return value;
}

export const env = {
  // --- Supabase (public) ---
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  // --- Razorpay (public key id only) ---
  razorpayKeyId: required(
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  ),
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",
};

// Server-only secrets. Access these ONLY from server code (route handlers,
// server actions, server components). They will be undefined in the browser.
export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  get razorpayKeyId() {
    return required("RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID);
  },
  get razorpayKeySecret() {
    return required("RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET);
  },
  get razorpayWebhookSecret() {
    return required(
      "RAZORPAY_WEBHOOK_SECRET",
      process.env.RAZORPAY_WEBHOOK_SECRET,
    );
  },
  get resendApiKey() {
    return required("RESEND_API_KEY", process.env.RESEND_API_KEY);
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "shoe-vault <onboarding@resend.dev>";
  },
};
