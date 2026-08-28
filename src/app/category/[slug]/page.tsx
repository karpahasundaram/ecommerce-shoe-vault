import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts } from "@/lib/queries";
import { parseProductQuery, type RawSearchParams } from "@/lib/search-params";
import { ProductGrid } from "@/components/product-card";
import { CatalogControls } from "@/components/catalog-controls";
import { EmptyState } from "@/components/ui/misc";
import { CATEGORIES } from "@/lib/constants";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description:
      category.description ?? `Shop ${category.name} at shoe-vault.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const query = parseProductQuery(sp, slug);
  const products = await getProducts(query);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {category.description}
          </p>
        )}
      </header>

      <CatalogControls basePath={`/category/${slug}`} />

      {products.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="No products match those filters in this category."
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
