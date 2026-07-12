"use client";

import { useState, useEffect } from "react";
import type { CloudImage } from "@/types";
import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BASE_URL = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL;

export function useImages() {
  const [images, setImages] = useState<CloudImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await fetch(`${API_URL}/images/`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setImages(data.map((img: any) => ({
          ...img,
          url: `${BASE_URL}${img.url}`,
          thumbnail: `${BASE_URL}${img.thumbnail}`,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const addImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/images/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (res.ok) {
        const img = await res.json();
        img.url = `${BASE_URL}${img.url}`;
        img.thumbnail = `${BASE_URL}${img.thumbnail}`;
        setImages((prev) => [img, ...prev]);
      }
    } catch (error) { console.error("Failed to upload image:", error); }
  };

  const deleteImage = async (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`${API_URL}/images/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    } catch (error) { console.error("Failed to delete image:", error); }
  };

  const getImage = (id: string) => images.find((i) => i.id === id);

  return { images, loaded, addImage, deleteImage, getImage };
}
