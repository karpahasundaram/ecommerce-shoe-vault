export const BRAND = "shoe-vault";

export const CATEGORIES = [
  { slug: "sneakers", name: "Sneakers" },
  { slug: "running-shoes", name: "Running Shoes" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

// UK sizing, whole sizes only — applies to both categories.
export const SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"];

// Shipping: flat fee, waived above the threshold. Mirrors the logic inside
// the create_order_from_cart() SQL function (which is the source of truth).
export const SHIPPING_FEE = 99;
export const FREE_SHIPPING_THRESHOLD = 2999;

export function shippingFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export const LOW_STOCK_THRESHOLD = 5;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
