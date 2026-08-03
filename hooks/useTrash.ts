"use client";

import { useCallback, useEffect, useState } from "react";
import type { TrashItem } from "@/types";
import { fetchWithAuth } from "@/lib/auth";
import { API_URL, getApiError } from "@/lib/api";

export function useTrash() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTrash = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/trash/`);
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo cargar la papelera"));
      setItems(await res.json());
    } catch (error) {
      console.error("Failed to fetch trash:", error);
      setError(error instanceof Error ? error.message : "No se pudo cargar la papelera");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchTrash();
    })();
  }, [fetchTrash]);

  const restoreItem = async (id: string) => {
    setActingId(id);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/trash/${id}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo restaurar el elemento"));
      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      console.error("Failed to restore trash item:", error);
      setError(error instanceof Error ? error.message : "No se pudo restaurar el elemento");
      return false;
    } finally {
      setActingId(null);
    }
  };

  const permanentlyDeleteItem = async (id: string) => {
    setActingId(id);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/trash/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo eliminar definitivamente"));
      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      console.error("Failed to permanently delete trash item:", error);
      setError(error instanceof Error ? error.message : "No se pudo eliminar definitivamente");
      return false;
    } finally {
      setActingId(null);
    }
  };

  return {
    items,
    loaded,
    actingId,
    error,
    clearError: () => setError(null),
    restoreItem,
    permanentlyDeleteItem,
  };
}
