import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import { totalStock } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { Badge } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, is_active, is_featured, category:categories(name), variants:product_variants(stock_quantity)",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {products?.length ?? 0} products
        </p>
        <Link
          href="/admin/products/new"
          className={buttonClasses({ size: "sm" })}
        >
          New product
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-subtle text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(products ?? []).map((p) => {
              const stock = totalStock(
                (p.variants as unknown as { stock_quantity: number }[]) ?? [],
              );
              const category = (p.category as unknown as { name: string } | null)
                ?.name;
              return (
                <tr key={p.id} className="hover:bg-subtle">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{category}</td>
                  <td className="px-4 py-3">{formatINR(p.price)}</td>
                  <td className="px-4 py-3">
                    {stock === 0 ? (
                      <Badge tone="brand">Out of stock</Badge>
                    ) : stock <= LOW_STOCK_THRESHOLD ? (
                      <Badge tone="warning">{stock} low</Badge>
                    ) : (
                      stock
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.is_active ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Badge tone="neutral">Hidden</Badge>
                      )}
                      {p.is_featured && <Badge tone="brand">Featured</Badge>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
