"use client";

import { useState, useEffect } from "react";
import type { Note } from "@/types";
import { getAuthHeaders, fetchWithAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/notes/`);
      if (res.ok) setNotes(await res.json());
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  const createNote = async (title = "", content = "") => {
    try {
      const res = await fetch(`${API_URL}/notes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const n = await res.json();
        setNotes((prev) => [n, ...prev]);
        return n;
      }
    } catch (error) { console.error("Failed to create note:", error); }
  };

  const updateNote = async (id: string, fields: Partial<Pick<Note, "title" | "content">>) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...fields, updatedAt: new Date().toISOString() } : n));
    try {
      await fetch(`${API_URL}/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(fields),
      });
    } catch (error) { console.error("Failed to update note:", error); }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`${API_URL}/notes/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    } catch (error) { console.error("Failed to delete note:", error); }
  };

  return { notes, loaded, createNote, updateNote, deleteNote };
}
