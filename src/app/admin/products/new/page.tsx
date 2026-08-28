import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground">
        ← Products
      </Link>
      <h2 className="mt-3 text-lg font-semibold">New product</h2>
      <p className="mt-1 text-sm text-muted">
        Create the product first, then add images on the next screen.
      </p>
      <div className="mt-6">
        <ProductForm categories={categories ?? []} />
      </div>
    </div>
  );
}
