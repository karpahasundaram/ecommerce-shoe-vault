"use client";

import { useState, useTransition } from "react";
import { saveAddress } from "@/actions/addresses";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";
import type { Address } from "@/lib/types";

export function AddressForm({
  address,
  onSaved,
  onCancel,
}: {
  address?: Address;
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: address?.id,
      label: String(fd.get("label") ?? ""),
      full_name: String(fd.get("full_name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      line1: String(fd.get("line1") ?? ""),
      line2: String(fd.get("line2") ?? ""),
      city: String(fd.get("city") ?? ""),
      state: String(fd.get("state") ?? ""),
      postal_code: String(fd.get("postal_code") ?? ""),
      country: "India",
      is_default: fd.get("is_default") === "on",
    };

    startTransition(async () => {
      const res = await saveAddress(payload);
      if (res.ok) {
        setErrors({});
        toast("Address saved.", "success");
        onSaved?.(res.id);
      } else {
        setErrors(res.fieldErrors ?? {});
        toast(res.error, "error");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-lg border border-border bg-white p-5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <Label htmlFor="label">Label (optional)</Label>
        <Input id="label" name="label" defaultValue={address?.label ?? ""} placeholder="Home, Work…" />
      </div>
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={address?.full_name} required />
        <FieldError>{errors.full_name}</FieldError>
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" inputMode="tel" defaultValue={address?.phone} required />
        <FieldError>{errors.phone}</FieldError>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="line1">Address line 1</Label>
        <Input id="line1" name="line1" defaultValue={address?.line1} required />
        <FieldError>{errors.line1}</FieldError>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="line2">Address line 2 (optional)</Label>
        <Input id="line2" name="line2" defaultValue={address?.line2 ?? ""} />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={address?.city} required />
        <FieldError>{errors.city}</FieldError>
      </div>
      <div>
        <Label htmlFor="state">State</Label>
        <Input id="state" name="state" defaultValue={address?.state} required />
        <FieldError>{errors.state}</FieldError>
      </div>
      <div>
        <Label htmlFor="postal_code">PIN code</Label>
        <Input id="postal_code" name="postal_code" inputMode="numeric" defaultValue={address?.postal_code} required />
        <FieldError>{errors.postal_code}</FieldError>
      </div>
      <label className="flex items-center gap-2 self-end text-sm">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={address?.is_default}
          className="size-4 accent-brand"
        />
        Set as default
      </label>

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Save address
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
