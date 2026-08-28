import type { Metadata } from "next";
import { getProducts } from "@/lib/queries";
import { parseProductQuery, type RawSearchParams } from "@/lib/search-params";
import { ProductGrid } from "@/components/product-card";
import { CatalogControls } from "@/components/catalog-controls";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "All Shoes",
  description: "Browse every sneaker and running shoe at shoe-vault.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const query = parseProductQuery(sp);
  const products = await getProducts(query);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">All shoes</h1>
        <p className="mt-1 text-sm text-muted">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </header>

      <CatalogControls basePath="/products" />

      {products.length === 0 ? (
        <EmptyState
          title="No shoes match those filters"
          description="Try widening your price range or clearing the size filter."
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
