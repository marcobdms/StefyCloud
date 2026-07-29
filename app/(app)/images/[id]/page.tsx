"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useImages } from "@/hooks/useImages";

export default function ImageViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { images, loaded, deletingId, error, deleteImage } = useImages();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const image = images.find((img) => img.id === id);

  if (!loaded) return null;

  if (!image) {
    return (
      <div className="pt-8 text-center text-[#6e6e73]">
        <p>Imagen no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[#0071e3] text-sm font-medium active:opacity-60 transition-opacity"
        >
          <ChevronLeft size={18} />
          Imágenes
        </button>
        <button
          onClick={async () => {
            if (!confirmingDelete) {
              setConfirmingDelete(true);
              return;
            }
            if (await deleteImage(id)) router.replace("/images");
          }}
          disabled={deletingId === id}
          className="text-[#FF3B30] active:opacity-60 transition-opacity"
          aria-label="Eliminar imagen"
        >
          {confirmingDelete ? (
            <span className="text-sm font-semibold">
              {deletingId === id ? "Eliminando..." : "Confirmar"}
            </span>
          ) : (
            <Trash2 size={17} />
          )}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-[#ffebe9] px-3 py-2.5 text-sm text-[#b42318]">
          {error}
        </div>
      )}

      <div className="relative w-full aspect-square rounded-[20px] overflow-hidden bg-[#e5e5ea]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold text-[#1d1d1f]">{image.title}</h2>
        <p className="text-sm text-[#6e6e73] mt-1">
          {new Date(image.createdAt).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
