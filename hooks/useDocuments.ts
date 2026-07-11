"use client";

import { useState, useEffect } from "react";
import type { Document } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/documents/`);
      if (res.ok) {
        const data = await res.json();
        // Construimos la URL completa para el frontend
        const docsWithFullUrl = data.map((d: any) => ({
          ...d,
          url: d.url ? `http://localhost:8000${d.url}` : undefined
        }));
        setDocuments(docsWithFullUrl);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const addDocument = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() as Document["type"];
    const allowed: Document["type"][] = ["pdf", "doc", "docx", "xls", "xlsx", "txt"];
    if (!allowed.includes(ext)) {
      alert("Formato no permitido");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/documents/`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const newDoc = await res.json();
        newDoc.url = newDoc.url ? `http://localhost:8000${newDoc.url}` : undefined;
        setDocuments((prev) => [newDoc, ...prev]);
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
    }
  };

  const deleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`${API_URL}/documents/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  return { documents, loaded, addDocument, deleteDocument };
}
