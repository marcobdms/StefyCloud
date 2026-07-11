"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StickyNote, ChevronRight } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import FloatingButton from "@/components/common/FloatingButton";
import SectionTitle from "@/components/common/SectionTitle";

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function NotesPage() {
  const router = useRouter();
  const { notes, loaded, createNote } = useNotes();
  const [search, setSearch] = useState("");

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = async () => {
    const note = await createNote();
    if (note) router.push(`/notes/${note.id}`);
  };

  if (!loaded) return null;

  return (
    <div className="pt-2">
      <SectionTitle title="Notas" />
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar notas..." />

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={StickyNote}
            title={search ? "Sin resultados" : "Sin notas"}
            description={search ? "No hay notas que coincidan" : "Pulsa + para crear tu primera nota"}
          />
        </div>
      ) : (
        <div className="mt-4 bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm overflow-hidden">
          {filtered.map((note, i) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className={`flex items-center gap-3 px-4 py-4 active:bg-[#f5f5f7] transition-colors ${
                i < filtered.length - 1 ? "border-b border-[#f2f2f7]" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#1d1d1f] truncate">
                  {note.title || "Sin título"}
                </p>
                <p className="text-sm text-[#6e6e73] truncate mt-0.5">
                  <span className="text-[#8e8e93] mr-2">{formatDate(note.updatedAt)}</span>
                  {note.content.split("\n")[0] || "Sin contenido"}
                </p>
              </div>
              <ChevronRight size={16} className="text-[#c7c7cc] flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      <FloatingButton onClick={handleNew} label="Nueva nota" />
    </div>
  );
}
