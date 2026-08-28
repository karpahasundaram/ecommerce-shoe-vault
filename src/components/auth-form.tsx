"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${env.siteUrl}/auth/callback?redirect=${encodeURIComponent(
              redirectTo,
            )}`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice(
            "Check your email to confirm your account, then log in. (You can disable email confirmation in Supabase → Authentication → Sign In / Providers.)",
          );
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {mode === "signup"
          ? "Sign up to check out and track your orders."
          : "Log in to continue."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" && (
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            required
          />
        </div>

        <FieldError>{error}</FieldError>
        {notice && (
          <p className="rounded-lg border border-border bg-subtle p-3 text-sm text-muted">
            {notice}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading}>
          {loading && <Spinner />}
          {mode === "signup" ? "Sign up" : "Log in"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium text-brand hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
