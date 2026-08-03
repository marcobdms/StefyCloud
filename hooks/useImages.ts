"use client";

import { useState, useEffect } from "react";
import type { CloudImage } from "@/types";
import { fetchWithAuth } from "@/lib/auth";
import { API_BASE_URL, API_URL, getApiError, resolveApiAssetUrl } from "@/lib/api";

export function useImages() {
  const [images, setImages] = useState<CloudImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/images/`);
      if (!res.ok) throw new Error(await getApiError(res, "No se pudieron cargar las imágenes"));
      const data = await res.json();
      setImages(data.map((img: CloudImage) => ({
        ...img,
        url: resolveApiAssetUrl(API_BASE_URL, img.url) ?? "",
        thumbnail: resolveApiAssetUrl(API_BASE_URL, img.thumbnail) ?? "",
      })));
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setError(error instanceof Error ? error.message : "No se pudieron cargar las imágenes");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void (async () => {
      await fetchImages();
    })();
  }, []);

  const addImage = async (file: File) => {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetchWithAuth(`${API_URL}/images/`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo subir la imagen"));
      const payload: CloudImage = await res.json();
      const image = {
        ...payload,
        url: resolveApiAssetUrl(API_BASE_URL, payload.url) ?? "",
        thumbnail: resolveApiAssetUrl(API_BASE_URL, payload.thumbnail) ?? "",
      };
      setImages((prev) => [image, ...prev]);
      return true;
    } catch (error) {
      console.error("Failed to upload image:", error);
      setError(error instanceof Error ? error.message : "No se pudo subir la imagen");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/images/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo eliminar la imagen"));
      setImages((prev) => prev.filter((image) => image.id !== id));
      return true;
    } catch (error) {
      console.error("Failed to delete image:", error);
      setError(error instanceof Error ? error.message : "No se pudo eliminar la imagen");
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const getImage = (id: string) => images.find((i) => i.id === id);

  return {
    images,
    loaded,
    uploading,
    deletingId,
    error,
    clearError: () => setError(null),
    addImage,
    deleteImage,
    getImage,
  };
}
