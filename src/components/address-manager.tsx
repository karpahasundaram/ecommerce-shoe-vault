"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { deleteAddress, setDefaultAddress } from "@/actions/addresses";
import { AddressForm } from "@/components/address-form";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import type { Address } from "@/lib/types";

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(addresses.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);

  function afterChange() {
    setAdding(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && !adding && (
        <EmptyState
          title="No saved addresses"
          description="Add one so checkout is quicker next time."
        />
      )}

      {addresses.map((a) =>
        editingId === a.id ? (
          <AddressForm
            key={a.id}
            address={a}
            onSaved={afterChange}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={a.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-4"
          >
            <div className="text-sm">
              <p className="flex items-center gap-2 font-medium">
                {a.label || a.full_name}
                {a.is_default && <Badge tone="brand">Default</Badge>}
              </p>
              <p className="mt-1 text-muted">
                {a.full_name}, {a.phone}
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state} {a.postal_code}, {a.country}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                className="text-xs text-brand hover:underline"
                onClick={() => setEditingId(a.id)}
              >
                Edit
              </button>
              {!a.is_default && (
                <button
                  className="text-xs text-muted hover:text-foreground disabled:opacity-50"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await setDefaultAddress(a.id);
                      router.refresh();
                    })
                  }
                >
                  Set default
                </button>
              )}
              <button
                className="text-xs text-muted hover:text-brand disabled:opacity-50"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await deleteAddress(a.id);
                    if (!res.ok) toast(res.error, "error");
                    router.refresh();
                  })
                }
              >
                Delete
              </button>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <AddressForm onSaved={afterChange} onCancel={() => setAdding(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add a new address
        </Button>
      )}
    </div>
  );
}
