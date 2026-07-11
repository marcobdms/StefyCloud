"use client";

import { useState, useEffect } from "react";
import type { CloudImage } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function useImages() {
  const [images, setImages] = useState<CloudImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await fetch(`${API_URL}/images/`);
      if (res.ok) {
        const data = await res.json();
        const imagesWithFullUrl = data.map((img: any) => ({
          ...img,
          url: `http://localhost:8000${img.url}`,
          thumbnail: `http://localhost:8000${img.thumbnail}`
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
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const newImg = await res.json();
        newImg.url = `http://localhost:8000${newImg.url}`;
        newImg.thumbnail = `http://localhost:8000${newImg.thumbnail}`;
        setImages((prev) => [newImg, ...prev]);
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  const deleteImage = async (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`${API_URL}/images/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const getImage = (id: string): CloudImage | undefined => images.find((i) => i.id === id);

  return { images, loaded, addImage, deleteImage, getImage };
}
