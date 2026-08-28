import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getProfile();

  if (!user || !profile) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold">Profile</h2>
      <p className="mt-1 text-sm text-muted">
        This name and phone are used on your orders.
      </p>
      <div className="mt-6">
        <ProfileForm profile={profile} email={user.email ?? ""} />
      </div>
    </div>
  );
}
