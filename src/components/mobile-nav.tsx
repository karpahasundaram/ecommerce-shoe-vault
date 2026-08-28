"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { signOut } from "@/actions/auth";

export function MobileNav({
  links,
  signedIn,
  isAdmin,
}: {
  links: { href: string; label: string }[];
  signedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={close}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                shoe<span className="text-brand">-vault</span>
              </span>
              <button
                type="button"
                onClick={close}
                className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-6 flex flex-col">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-subtle"
                >
                  {l.label}
                </Link>
              ))}
              <hr className="my-3" />
              {signedIn ? (
                <>
                  <Link href="/account" onClick={close} className="rounded-lg px-3 py-3 text-sm hover:bg-subtle">
                    My account
                  </Link>
                  <Link href="/account/orders" onClick={close} className="rounded-lg px-3 py-3 text-sm hover:bg-subtle">
                    Orders
                  </Link>
                  <Link href="/account/addresses" onClick={close} className="rounded-lg px-3 py-3 text-sm hover:bg-subtle">
                    Addresses
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={close} className="rounded-lg px-3 py-3 text-sm hover:bg-subtle">
                      Admin
                    </Link>
                  )}
                  <form action={signOut}>
                    <button type="submit" className="w-full rounded-lg px-3 py-3 text-left text-sm text-brand hover:bg-subtle">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" onClick={close} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-subtle">
                  Log in / Sign up
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
