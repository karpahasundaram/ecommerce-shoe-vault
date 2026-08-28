import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { BRAND, CATEGORIES } from "@/lib/constants";
import { getProfile } from "@/lib/auth";
import { CartBadge } from "@/components/cart-badge";
import { AccountMenu } from "@/components/account-menu";
import { MobileNav } from "@/components/mobile-nav";

const navLinks = [
  { href: "/products", label: "All Shoes" },
  ...CATEGORIES.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
];

export async function SiteHeader() {
  const profile = await getProfile();
  const signedIn = Boolean(profile);
  const isAdmin = Boolean(profile?.is_admin);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <MobileNav links={navLinks} signedIn={signedIn} isAdmin={isAdmin} />

        <Link
          href="/"
          className="text-lg font-bold tracking-tight sm:text-xl"
          aria-label={`${BRAND} home`}
        >
          shoe<span className="text-brand">-vault</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <AccountMenu signedIn={signedIn} isAdmin={isAdmin} />
          <Link
            href="/cart"
            className="relative inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle"
            aria-label="Cart"
          >
            <ShoppingBag className="size-5" />
            <CartBadge />
          </Link>
        </div>
      </div>
    </header>
  );
}
