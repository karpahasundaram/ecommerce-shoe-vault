"use client";

import { useTransition } from "react";
import { updateProfile } from "@/actions/profile";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";
import type { Profile } from "@/lib/types";

export function ProfileForm({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfile({
        full_name: String(fd.get("full_name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
      });
      toast(
        res.ok ? "Profile updated." : res.error,
        res.ok ? "success" : "error",
      );
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          inputMode="tel"
          defaultValue={profile.phone ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        Save changes
      </Button>
    </form>
  );
}
