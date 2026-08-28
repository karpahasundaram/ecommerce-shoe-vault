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

  const heroImage =
    featured[0]?.images?.[0]?.url ?? categories[0]?.image_url ?? null;

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">
              New season
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
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

          {heroImage && (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-brand-subtle sm:aspect-[3/2] lg:aspect-[4/5]">
              <Image
                src={heroImage}
                alt={featured[0]?.name ?? "Featured shoe"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
              {featured[0] && (
                <Link
                  href={`/products/${featured[0].slug}`}
                  className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur"
                >
                  {featured[0].name}
                  <ArrowRight className="size-4 text-brand" />
                </Link>
              )}
            </div>
          )}
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
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group relative flex aspect-[3/2] items-end overflow-hidden rounded-2xl border border-border bg-subtle"
            >
              {c.image_url ? (
                <Image
                  src={c.image_url}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-brand-subtle" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="relative z-10 flex w-full items-center justify-between p-6">
                <span className="text-xl font-bold text-white drop-shadow">
                  {c.name}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold">
                  Shop <ArrowRight className="size-4 text-brand" />
                </span>
              </div>
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
