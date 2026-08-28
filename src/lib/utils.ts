import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes conditionally. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** URL-friendly slug from an arbitrary string. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function totalStock(variants: { stock_quantity: number }[]): number {
  return variants.reduce((sum, v) => sum + v.stock_quantity, 0);
}
