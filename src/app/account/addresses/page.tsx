import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AddressManager } from "@/components/address-manager";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user!.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="text-lg font-semibold">Saved addresses</h2>
      <p className="mt-1 text-sm text-muted">
        Pick one of these at checkout.
      </p>
      <div className="mt-6">
        <AddressManager addresses={(data ?? []) as Address[]} />
      </div>
    </div>
  );
}
