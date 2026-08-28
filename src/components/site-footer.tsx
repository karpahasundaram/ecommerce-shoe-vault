import Link from "next/link";
import { BRAND, CATEGORIES } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-subtle">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <span className="text-lg font-bold">
            shoe<span className="text-brand">-vault</span>
          </span>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Clean, modern footwear. Sneakers and running shoes, shipped across
            India.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/products" className="hover:text-foreground">
                All shoes
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Account</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/account/orders" className="hover:text-foreground">
                Order history
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-foreground">
                Log in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} {BRAND}. Demo store — payments run in
        Razorpay test mode.
      </div>
    </footer>
  );
}
