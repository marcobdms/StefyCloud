"use client";

import { useEffect, useState } from "react";
import type { FavoriteItem, TrashItemType } from "@/types";
import { API_URL, getApiError } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";

function notifyFavorite(message: string) {
  window.dispatchEvent(
    new CustomEvent("stefycloud:favorite-toast", {
      detail: { message },
    }),
  );
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/favorites/`);
      if (!res.ok) throw new Error(await getApiError(res, "No se pudieron cargar los favoritos"));
      setFavorites(await res.json());
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      setError(error instanceof Error ? error.message : "No se pudieron cargar los favoritos");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void fetchFavorites();
  }, []);

  const getFavorite = (itemType: TrashItemType, itemId: string) =>
    favorites.find((favorite) => favorite.itemType === itemType && favorite.itemId === itemId);

  const isFavorite = (itemType: TrashItemType, itemId: string) =>
    Boolean(getFavorite(itemType, itemId));

  const addFavorite = async (itemType: TrashItemType, itemId: string) => {
    const existing = getFavorite(itemType, itemId);
    if (existing) return existing;

    setActingId(`${itemType}:${itemId}`);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/favorites/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: itemType, item_id: itemId }),
      });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo añadir a favoritos"));
      const favorite: FavoriteItem = await res.json();
      setFavorites((prev) => [
        favorite,
        ...prev.filter(
          (item) => !(item.itemType === favorite.itemType && item.itemId === favorite.itemId),
        ),
      ]);
      notifyFavorite("Añadido a favoritos");
      return favorite;
    } catch (error) {
      console.error("Failed to add favorite:", error);
      setError(error instanceof Error ? error.message : "No se pudo añadir a favoritos");
    } finally {
      setActingId(null);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    setActingId(favoriteId);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/favorites/${favoriteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo quitar de favoritos"));
      setFavorites((prev) => prev.filter((favorite) => favorite.id !== favoriteId));
      notifyFavorite("Sacado de favoritos");
      return true;
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      setError(error instanceof Error ? error.message : "No se pudo quitar de favoritos");
      return false;
    } finally {
      setActingId(null);
    }
  };

  const toggleFavorite = async (itemType: TrashItemType, itemId: string) => {
    const existing = getFavorite(itemType, itemId);
    if (existing) return removeFavorite(existing.id);
    return addFavorite(itemType, itemId);
  };

  return {
    favorites,
    loaded,
    actingId,
    error,
    clearError: () => setError(null),
    getFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
