import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AccountNav } from "@/components/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("/account");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">My account</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[200px_1fr]">
        <AccountNav />
        <div>{children}</div>
      </div>
      <p className="mt-12 text-sm text-muted">
        <Link href="/products" className="hover:text-foreground">
          ← Continue shopping
        </Link>
      </p>
    </div>
  );
}
