const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format a rupee amount, e.g. 4999 -> "₹4,999". */
export function formatINR(amount: number): string {
  return inr.format(amount);
}

/** Razorpay works in paise (smallest unit). 4999 -> 499900. */
export function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(value: string | Date): string {
  return dateFmt.format(new Date(value));
}
