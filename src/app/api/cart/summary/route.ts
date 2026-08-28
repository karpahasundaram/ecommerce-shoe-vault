import { NextResponse } from "next/server";
import { getCart, cartTotals } from "@/lib/queries";

export async function GET() {
  const { count, subtotal } = cartTotals(await getCart());
  return NextResponse.json({ count, subtotal });
}
