import type { ProductQuery } from "@/lib/queries";
import type { SortValue } from "@/lib/constants";
import { SORT_OPTIONS } from "@/lib/constants";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseProductQuery(
  sp: RawSearchParams,
  categorySlug?: string,
): ProductQuery {
  const sortRaw = str(sp.sort);
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as SortValue)
    : undefined;

  return {
    categorySlug,
    sort,
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    size: str(sp.size),
  };
}
