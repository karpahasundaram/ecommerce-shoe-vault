import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { BRAND } from "@/lib/constants";
import { env } from "@/lib/env";
import { getCart, cartTotals } from "@/lib/queries";
import { ToastProvider } from "@/components/toast";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${BRAND} — Sneakers & Running Shoes`,
    template: `%s · ${BRAND}`,
  },
  description:
    "shoe-vault — a clean, modern store for sneakers and running shoes. Free shipping over ₹2,999.",
  openGraph: {
    title: `${BRAND} — Sneakers & Running Shoes`,
    description:
      "A clean, modern store for sneakers and running shoes.",
    type: "website",
    url: env.siteUrl,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { count, subtotal } = cartTotals(await getCart());

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background">
        <ToastProvider>
          <CartProvider initial={{ count, subtotal }}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </CartProvider>
        </ToastProvider>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
