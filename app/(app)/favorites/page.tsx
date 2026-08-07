"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  FileText,
  Image,
  Star,
  StickyNote,
} from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import SectionTitle from "@/components/common/SectionTitle";
import { useFavorites } from "@/hooks/useFavorites";
import { useImages } from "@/hooks/useImages";
import { API_BASE_URL, resolveApiAssetUrl } from "@/lib/api";
import type { FavoriteItem, TrashItemType } from "@/types";

const typeConfig: Record<TrashItemType, { label: string; icon: typeof StickyNote; color: string }> = {
  note: { label: "Nota", icon: StickyNote, color: "#FFD60A" },
  document: { label: "Documento", icon: FileText, color: "#34C759" },
  image: { label: "Imagen", icon: Image, color: "#FF9500" },
  reminder: { label: "Recordatorio", icon: Bell, color: "#0071e3" },
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFavoriteHref(item: FavoriteItem) {
  if (!item.targetUrl) return null;
  if (item.itemType === "document") {
    return resolveApiAssetUrl(API_BASE_URL, item.targetUrl) ?? null;
  }
  return item.targetUrl;
}

export default function FavoritesPage() {
  const { favorites, loaded, error } = useFavorites();
  const { images, loaded: imagesLoaded } = useImages();

  if (!loaded || !imagesLoaded) return null;

  return (
    <div className="page-animate pt-2 pb-8">
      <SectionTitle title="Favoritos" />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-[16px] border border-[#ff3b30]/20 bg-[#ff3b30]/10 px-4 py-3 text-sm text-[#b42318]"
        >
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Sin favoritos"
          description="Añade elementos desde el menú de tres puntos"
        />
      ) : (
        <div className="bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm overflow-hidden">
          {favorites.map((item, index) => {
            const config = typeConfig[item.itemType];
            const Icon = config.icon;
            const href = getFavoriteHref(item);
            const image = item.itemType === "image"
              ? images.find((candidate) => candidate.id === item.itemId)
              : null;
            const row = (
              <>
                {image?.thumbnail ? (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#f5f5f7] p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.thumbnail}
                      alt=""
                      className="h-full w-full rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <Icon size={19} style={{ color: config.color }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#6e6e73] mt-0.5">
                    {config.label} · añadido {formatDate(item.createdAt)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#c7c7cc] flex-shrink-0" />
              </>
            );

            const className = `flex items-center gap-3 px-4 py-4 transition-colors ${
              index < favorites.length - 1 ? "border-b border-[#f2f2f7]" : ""
            }`;

            if (!href) {
              return (
                <div key={item.id} className={`${className} opacity-60`}>
                  {row}
                </div>
              );
            }

            if (item.itemType === "document") {
              return (
                <a
                  key={item.id}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={`${className} active:bg-[#f5f5f7]`}
                >
                  {row}
                </a>
              );
            }

            return (
              <Link key={item.id} href={href} className={`${className} active:bg-[#f5f5f7]`}>
                {row}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
