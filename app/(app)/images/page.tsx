"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ImageIcon, X } from "lucide-react";
import { useImages } from "@/hooks/useImages";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import FloatingButton from "@/components/common/FloatingButton";
import SectionTitle from "@/components/common/SectionTitle";
import type { CloudImage } from "@/types";

const INITIAL_IMAGE_READY_COUNT = 12;

function ImageSectionLoader({ hidden }: { hidden: boolean }) {
  return (
    <div
      className={`sc-images-loading-state ${hidden ? "sc-images-loading-state-hidden" : ""}`}
      role={hidden ? undefined : "status"}
      aria-live="polite"
      aria-hidden={hidden || undefined}
    >
      <span className="sc-images-spinner" aria-hidden="true" />
      <span className="sr-only">Cargando imágenes...</span>
    </div>
  );
}

function ImageTile({
  image,
  priority,
  onReady,
}: {
  image: CloudImage;
  priority: boolean;
  onReady: (id: string) => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const markReady = useCallback(() => onReady(image.id), [image.id, onReady]);

  useEffect(() => {
    if (imageRef.current?.complete) markReady();
  }, [markReady]);

  return (
    <Link
      href={`/images/${image.id}`}
      transitionTypes={["nav-forward"]}
      className="relative aspect-square rounded-xl overflow-hidden bg-[#f5f5f7] p-1.5 transition-[transform,opacity,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:shadow-md active:translate-y-0 active:scale-[0.98] active:opacity-80"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={image.thumbnail}
        alt={image.title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={markReady}
        onError={markReady}
        className="h-full w-full rounded-lg object-contain"
      />
    </Link>
  );
}

export default function ImagesPage() {
  const { images, loaded, uploading, error, clearError, addImage } = useImages();
  const [search, setSearch] = useState("");
  const [readyImageIds, setReadyImageIds] = useState<Set<string>>(() => new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const filtered = images.filter((img) =>
    img.title.toLowerCase().includes(search.toLowerCase())
  );
  const readyTargetIds = filtered.slice(0, INITIAL_IMAGE_READY_COUNT).map((img) => img.id);
  const hasImages = loaded && filtered.length > 0;
  const imagesReady = hasImages && readyTargetIds.every((id) => readyImageIds.has(id));

  const markImageReady = useCallback((id: string) => {
    setReadyImageIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await addImage(file);
    }
    e.target.value = "";
  };

  // NOTE: we intentionally do NOT guard on `loaded` before rendering —
  // the skeleton above provides immediate visual feedback so the page
  // transition completes without waiting for the network request.

  return (
    <div className="page-animate pt-2">
      {/* Hidden file inputs – multiple images allowed */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <SectionTitle title="Imágenes" />
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar imágenes..." />

      {error && (
        <div role="alert" className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-[#ffebe9] px-3 py-2.5 text-sm text-[#b42318]">
          <span>{error}</span>
          <button onClick={clearError} aria-label="Cerrar error" className="flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      )}
      {uploading && <p className="mt-3 text-sm text-[#6e6e73]">Subiendo imagen...</p>}

      {!loaded ? (
        <div className="sc-images-stage mt-4 min-h-[220px]">
          <ImageSectionLoader hidden={false} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ImageIcon}
            title={search ? "Sin resultados" : "Sin imágenes"}
            description={search ? "No hay imágenes que coincidan" : "Pulsa + para añadir imágenes"}
          />
        </div>
      ) : (
        <div className="sc-images-stage mt-4" aria-busy={!imagesReady}>
          <ImageSectionLoader hidden={imagesReady} />
          <div className={`sc-images-grid grid grid-cols-3 gap-1.5 ${imagesReady ? "sc-images-grid-ready" : ""}`}>
            {filtered.map((img, index) => (
              <ImageTile
                key={img.id}
                image={img}
                priority={index < INITIAL_IMAGE_READY_COUNT}
                onReady={markImageReady}
              />
            ))}
          </div>
        </div>
      )}

      <FloatingButton
        onClick={() => cameraInputRef.current?.click()}
        label="Tomar foto"
        disabled={uploading}
        icon={<Camera size={24} strokeWidth={2} />}
        position="secondary"
      />
      <FloatingButton
        onClick={() => fileInputRef.current?.click()}
        label="Subir imagen"
        disabled={uploading}
      />
    </div>
  );
}
