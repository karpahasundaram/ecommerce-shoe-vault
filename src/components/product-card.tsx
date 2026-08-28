import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { totalStock } from "@/lib/utils";
import { Badge } from "@/components/ui/misc";
import type { ProductCardData } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const primary =
    product.images.find(() => true) ?? { url: "", alt: product.name };
  const soldOut = totalStock(product.variants) === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-subtle">
        {primary.url ? (
          <Image
            src={primary.url}
            alt={primary.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {soldOut && (
          <span className="absolute left-3 top-3">
            <Badge tone="neutral">Sold out</Badge>
          </span>
        )}
        {product.is_featured && !soldOut && (
          <span className="absolute left-3 top-3">
            <Badge tone="brand">Featured</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wide text-muted">
          {product.category.name}
        </span>
        <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
        <span className="mt-auto pt-2 text-sm font-semibold">
          {formatINR(product.price)}
        </span>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
