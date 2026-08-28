"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { signOut } from "@/actions/auth";

export function AccountMenu({
  signedIn,
  isAdmin,
}: {
  signedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium hover:bg-subtle sm:inline-flex"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <User className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          <MenuLink href="/account" onClick={() => setOpen(false)}>
            My account
          </MenuLink>
          <MenuLink href="/account/orders" onClick={() => setOpen(false)}>
            Orders
          </MenuLink>
          <MenuLink href="/account/addresses" onClick={() => setOpen(false)}>
            Addresses
          </MenuLink>
          {isAdmin && (
            <MenuLink href="/admin" onClick={() => setOpen(false)}>
              Admin
            </MenuLink>
          )}
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-brand hover:bg-subtle"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block px-4 py-2 text-sm hover:bg-subtle"
    >
      {children}
    </Link>
  );
}
