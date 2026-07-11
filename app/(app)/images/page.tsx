"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useImages } from "@/hooks/useImages";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import FloatingButton from "@/components/common/FloatingButton";
import SectionTitle from "@/components/common/SectionTitle";

export default function ImagesPage() {
  const { images, loaded, addImage } = useImages();
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = images.filter((img) =>
    img.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => addImage(file));
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

      <FloatingButton onClick={() => fileInputRef.current?.click()} label="Subir imagen" />
    </div>
  );
}
