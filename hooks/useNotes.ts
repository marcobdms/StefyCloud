"use client";

import { useState, useEffect } from "react";
import type { Note } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const OPTS = { credentials: "include" as RequestCredentials };

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes/`, OPTS);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const createNote = async (title: string = "", content: string = "") => {
    try {
      const res = await fetch(`${API_URL}/notes/`, {
        ...OPTS,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes((prev) => [newNote, ...prev]);
        return newNote;
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const updateNote = async (id: string, fields: Partial<Pick<Note, "title" | "content">>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...fields, updatedAt: new Date().toISOString() } : n)));
    try {
      await fetch(`${API_URL}/notes/${id}`, {
        ...OPTS,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`${API_URL}/notes/${id}`, { ...OPTS, method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return { notes, loaded, createNote, updateNote, deleteNote };
}
