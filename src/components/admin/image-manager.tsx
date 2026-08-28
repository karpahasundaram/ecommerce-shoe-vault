"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, Upload } from "lucide-react";
import {
  addProductImage,
  deleteProductImage,
  setPrimaryImage,
} from "@/actions/admin";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import type { ProductImage } from "@/lib/types";

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [busy, startBusy] = useTransition();
  const [alt, setAlt] = useState("");

  function upload(file: File) {
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("file", file);
    fd.set("alt", alt);
    startUpload(async () => {
      const res = await addProductImage(fd);
      if (res.ok) {
        toast("Image uploaded.", "success");
        setAlt("");
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <div>
      <h2 className="text-sm font-semibold">Images</h2>

      {images.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden rounded-lg border border-border"
            >
              <div className="relative aspect-square bg-subtle">
                <Image
                  src={img.url}
                  alt={img.alt || "Product image"}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {img.is_primary && (
                  <span className="absolute left-2 top-2 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-brand-foreground">
                    Primary
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-2">
                <button
                  type="button"
                  disabled={busy || img.is_primary}
                  onClick={() =>
                    startBusy(async () => {
                      await setPrimaryImage(img.id, productId);
                      router.refresh();
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground disabled:opacity-40"
                >
                  <Star className="size-3.5" /> Primary
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    startBusy(async () => {
                      await deleteProductImage(img.id, productId);
                      router.refresh();
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">No images yet.</p>
      )}

      <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border p-4">
        <input
          className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
          placeholder="Alt text (optional)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-subtle file:px-3 file:py-2 file:text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Spinner /> : <Upload className="size-4" />}
          Upload image
        </Button>
      </div>
    </div>
  );
}
