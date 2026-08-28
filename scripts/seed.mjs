// Seed the catalog: upload the sample images to Supabase Storage and insert
// 6 products (3 Sneakers, 3 Running Shoes) with UK 6–12 size variants.
//
// Usage:  npm run seed
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
// Safe to run multiple times (idempotent by product slug).

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  process.loadEnvFile(join(root, ".env.local"));
} catch {
  // env vars may already be present in the shell
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local (see SETUP.md).",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "product-images";

const CATEGORIES = [
  {
    slug: "sneakers",
    name: "Sneakers",
    description:
      "Everyday low-tops and court classics — clean lines, all-day comfort.",
    image: "images/sneakers/sneakers-img-1.jpg",
  },
  {
    slug: "running-shoes",
    name: "Running Shoes",
    description: "Lightweight trainers built for the road and the trail.",
    image: "images/running-shoes/img-1.jpg",
  },
];

const PRODUCTS = [
  {
    slug: "vault-street-low",
    name: "Vault Street Low",
    category: "sneakers",
    price: 4999,
    is_featured: true,
    image: "images/sneakers/sneakers-img-1.jpg",
    description:
      "A pared-back low-top for daily wear. Soft leather upper, cushioned collar and a durable rubber outsole that grips wet pavement.",
    stock: [10, 14, 18, 20, 12, 6, 3],
  },
  {
    slug: "vault-court-classic",
    name: "Vault Court Classic",
    category: "sneakers",
    price: 5499,
    is_featured: true,
    image: "images/sneakers/sneakers-img-2.jpg",
    description:
      "Retro tennis silhouette, modern comfort. Full-grain overlays, a breathable lining and a foam midsole that holds its shape.",
    stock: [8, 10, 16, 16, 10, 5, 0],
  },
  {
    slug: "vault-air-glide",
    name: "Vault Air Glide",
    category: "sneakers",
    price: 6999,
    is_featured: false,
    image: "images/sneakers/sneakers-img-3.jpg",
    description:
      "A lifestyle sneaker with a visible air unit for spring underfoot. Knit upper, sock-like fit, all-day support.",
    stock: [6, 9, 12, 15, 11, 7, 4],
  },
  {
    slug: "vault-tempo-racer",
    name: "Vault Tempo Racer",
    category: "running-shoes",
    price: 7499,
    is_featured: true,
    image: "images/running-shoes/img-1.jpg",
    description:
      "Built for fast days. A responsive foam midsole, featherweight mesh upper and a low-profile outsole for quick turnover.",
    stock: [7, 11, 14, 18, 13, 8, 4],
  },
  {
    slug: "vault-endure-2",
    name: "Vault Endure 2",
    category: "running-shoes",
    price: 8999,
    is_featured: false,
    image: "images/running-shoes/img-2.jpg",
    description:
      "Your long-run companion. Maximum cushioning, a plush heel and a rocker geometry that keeps you rolling forward mile after mile.",
    stock: [5, 8, 12, 16, 12, 6, 3],
  },
  {
    slug: "vault-trail-blaze",
    name: "Vault Trail Blaze",
    category: "running-shoes",
    price: 6499,
    is_featured: false,
    image: "images/running-shoes/img-3.jpg",
    description:
      "Off-road grip and protection. Aggressive lugs, a rock plate underfoot and a water-resistant upper for messy trails.",
    stock: [6, 10, 13, 15, 10, 5, 2],
  },
];

const SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"];

const contentType = (path) =>
  path.endsWith(".png")
    ? "image/png"
    : path.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";

async function uploadImage(relPath) {
  const bytes = await readFile(join(root, relPath));
  const key = `seed/${relPath.split("/").pop()}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, bytes, { contentType: contentType(relPath), upsert: true });
  if (error) throw new Error(`upload ${relPath}: ${error.message}`);
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return publicUrl;
}

async function main() {
  console.log("→ Ensuring storage bucket exists…");
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const categoryIds = {};
  for (const c of CATEGORIES) {
    const imageUrl = await uploadImage(c.image);
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        { slug: c.slug, name: c.name, description: c.description, image_url: imageUrl },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;
    categoryIds[c.slug] = data.id;
    console.log(`✓ category ${c.name}`);
  }

  for (const p of PRODUCTS) {
    const imageUrl = await uploadImage(p.image);
    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          slug: p.slug,
          name: p.name,
          category_id: categoryIds[p.category],
          description: p.description,
          price: p.price,
          is_featured: p.is_featured,
          is_active: true,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;

    await supabase.from("product_images").delete().eq("product_id", product.id);
    await supabase.from("product_images").insert({
      product_id: product.id,
      url: imageUrl,
      alt: p.name,
      position: 0,
      is_primary: true,
    });

    for (let i = 0; i < SIZES.length; i++) {
      await supabase.from("product_variants").upsert(
        {
          product_id: product.id,
          size: SIZES[i],
          stock_quantity: p.stock[i] ?? 0,
        },
        { onConflict: "product_id,size" },
      );
    }
    console.log(`✓ product ${p.name}`);
  }

  console.log("\nDone. 6 products seeded.");
  console.log(
    "Next: sign up in the app, then run this SQL to make yourself an admin:",
  );
  console.log(
    "  update public.profiles set is_admin = true where id = '<your-auth-user-id>';",
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message ?? err);
  process.exit(1);
});
