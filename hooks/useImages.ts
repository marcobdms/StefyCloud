"use client";

import { useState, useEffect } from "react";
import type { CloudImage } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BASE_URL = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL;
const OPTS = { credentials: "include" as RequestCredentials };

export function useImages() {
  const [images, setImages] = useState<CloudImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await fetch(`${API_URL}/images/`, OPTS);
      if (res.ok) {
        const data = await res.json();
        const imagesWithFullUrl = data.map((img: any) => ({
          ...img,
          url: `${BASE_URL}${img.url}`,
          thumbnail: `${BASE_URL}${img.thumbnail}`
        }));
        setImages(imagesWithFullUrl);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const addImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/images/`, {
        ...OPTS,
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const newImg = await res.json();
        newImg.url = `${BASE_URL}${newImg.url}`;
        newImg.thumbnail = `${BASE_URL}${newImg.thumbnail}`;
        setImages((prev) => [newImg, ...prev]);
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  const deleteImage = async (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`${API_URL}/images/${id}`, { ...OPTS, method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const getImage = (id: string): CloudImage | undefined => images.find((i) => i.id === id);

  return { images, loaded, addImage, deleteImage, getImage };
}
