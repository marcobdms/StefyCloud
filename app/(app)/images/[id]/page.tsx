"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useImages } from "@/hooks/useImages";

export default function ImageViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { images, loaded, deletingId, error, deleteImage } = useImages();
  const { isFavorite, toggleFavorite, actingId } = useFavorites();
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
    <div className="page-animate pt-2">
      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-[#ffebe9] px-3 py-2.5 text-sm text-[#b42318]">
          {error}
        </div>
      )}

      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[20px] bg-[#f5f5f7] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.title}
          className="h-auto max-h-[72vh] w-auto max-w-full rounded-2xl object-contain"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-[#1d1d1f]">{image.title}</h2>
          <p className="mt-1 text-sm text-[#6e6e73]">
            {new Date(image.createdAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleFavorite("image", id)}
            disabled={actingId === `image:${id}`}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-[#FF9500] transition-[background-color,opacity] hover:bg-[#fff3df] focus-visible:bg-[#fff3df] active:opacity-60 disabled:opacity-40"
            aria-label={isFavorite("image", id) ? "Quitar imagen de favoritos" : "Añadir imagen a favoritos"}
          >
            <Star size={18} fill={isFavorite("image", id) ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!confirmingDelete) {
                setConfirmingDelete(true);
                return;
              }
              if (await deleteImage(id)) router.replace("/images", { transitionTypes: ["nav-back"] });
            }}
            disabled={deletingId === id}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-[#FF3B30] transition-[background-color,opacity] hover:bg-[#ffebe9] focus-visible:bg-[#ffebe9] active:opacity-60 disabled:opacity-40"
            aria-label={confirmingDelete ? "Confirmar eliminar imagen" : "Eliminar imagen"}
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
      </div>
    </div>
  );
}
