import Link from "next/link";
import Image from "next/image";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getCategories, getFeaturedProducts } from "@/lib/queries";
import { ProductGrid } from "@/components/product-card";
import { buttonClasses } from "@/components/ui/button";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(3),
    getCategories(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            New season
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Shoes that keep up with you.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            A tight, well-chosen line of sneakers and running shoes. No noise —
            just the pairs worth owning.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className={buttonClasses({ size: "lg" })}>
              Shop all shoes <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/category/running-shoes"
              className={buttonClasses({ variant: "outline", size: "lg" })}
            >
              Running shoes
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-border bg-subtle">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          <Prop icon={<Truck className="size-5" />} title="Free shipping over ₹2,999" text="Flat ₹99 below that." />
          <Prop icon={<RotateCcw className="size-5" />} title="7-day easy returns" text="Unworn, with the box." />
          <Prop icon={<ShieldCheck className="size-5" />} title="Secure checkout" text="Payments via Razorpay." />
        </div>
      </section>

      {/* Category showcase */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group relative flex h-56 items-end overflow-hidden rounded-lg border border-border bg-subtle p-6"
            >
              {c.image_url && (
                <Image
                  src={c.image_url}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm">
                {c.name} <ArrowRight className="size-4 text-brand" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Featured</h2>
            <Link
              href="/products"
              className="text-sm font-medium text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={featured} />
          </div>
        </section>
      )}
    </div>
  );
}

function Prop({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-brand">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted">{text}</p>
      </div>
    </div>
  );
}
