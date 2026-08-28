"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-subtle">
        {current?.url && (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative size-20 overflow-hidden rounded-lg border bg-subtle",
                i === active ? "border-brand" : "border-border",
              )}
              aria-label={`View image ${i + 1}`}
            >
              {img.url && (
                <Image
                  src={img.url}
                  alt={img.alt || `${name} ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
