import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Admin
          <span className="ml-2 text-sm font-normal text-muted">shoe-vault</span>
        </h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-muted hover:text-foreground">
            Products
          </Link>
          <Link href="/" className="text-muted hover:text-foreground">
            View store →
          </Link>
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
