"use client";

import { useState, useEffect } from "react";
import type { Document } from "@/types";
import { fetchWithAuth } from "@/lib/auth";
import { API_BASE_URL, API_URL, getApiError, resolveApiAssetUrl } from "@/lib/api";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/documents/`);
      if (!res.ok) throw new Error(await getApiError(res, "No se pudieron cargar los documentos"));
      const data = await res.json();
      setDocuments(data.map((document: Document) => ({
        ...document,
        url: resolveApiAssetUrl(API_BASE_URL, document.url),
      })));
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setError(error instanceof Error ? error.message : "No se pudieron cargar los documentos");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void (async () => {
      await fetchDocuments();
    })();
  }, []);

  const addDocument = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() as Document["type"];
    const allowed: Document["type"][] = ["pdf", "doc", "docx", "xls", "xlsx", "txt"];
    if (!allowed.includes(ext)) {
      setError("Formato no permitido");
      return false;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetchWithAuth(`${API_URL}/documents/`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo subir el documento"));
      const payload: Document = await res.json();
      const document = {
        ...payload,
        url: resolveApiAssetUrl(API_BASE_URL, payload.url),
      };
      setDocuments((prev) => [document, ...prev]);
      return true;
    } catch (error) {
      console.error("Failed to upload document:", error);
      setError(error instanceof Error ? error.message : "No se pudo subir el documento");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo eliminar el documento"));
      setDocuments((prev) => prev.filter((document) => document.id !== id));
      return true;
    } catch (error) {
      console.error("Failed to delete document:", error);
      setError(error instanceof Error ? error.message : "No se pudo eliminar el documento");
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  return {
    documents,
    loaded,
    uploading,
    deletingId,
    error,
    clearError: () => setError(null),
    addDocument,
    deleteDocument,
  };
}
