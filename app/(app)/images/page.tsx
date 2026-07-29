"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ImageIcon, X } from "lucide-react";
import { useImages } from "@/hooks/useImages";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import FloatingButton from "@/components/common/FloatingButton";
import SectionTitle from "@/components/common/SectionTitle";

export default function ImagesPage() {
  const { images, loaded, uploading, error, clearError, addImage } = useImages();
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = images.filter((img) =>
    img.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await addImage(file);
    }
    e.target.value = "";
  };

  if (!loaded) return null;

  return (
    <div className="pt-2">
      {/* Hidden file input – multiple images allowed */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
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

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ImageIcon}
            title={search ? "Sin resultados" : "Sin imágenes"}
            description={search ? "No hay imágenes que coincidan" : "Pulsa + para añadir imágenes"}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {filtered.map((img) => (
            <Link
              key={img.id}
              href={`/images/${img.id}`}
              className="relative aspect-square rounded-xl overflow-hidden bg-[#e5e5ea] active:opacity-80 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnail}
                alt={img.title}
                className="w-full h-full object-cover"
              />
            </Link>
          ))}
        </div>
      )}

      <FloatingButton
        onClick={() => fileInputRef.current?.click()}
        label="Subir imagen"
        disabled={uploading}
      />
    </div>
  );
}
