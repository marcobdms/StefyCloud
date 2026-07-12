"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import MarqueeText from "@/components/common/MarqueeText";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { notes, loaded, updateNote, deleteNote } = useNotes();

  const note = notes.find((n) => n.id === id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);

  useEffect(() => {
    if (loaded && note && !initialized) {
      setTitle(note.title);
      setContent(note.content);
      setInitialized(true);
    }
  }, [loaded, note, initialized]);

  // Debounced auto-save
  useEffect(() => {
    if (!initialized) return;
    setSaved(false);
    const timer = setTimeout(() => {
      updateNote(id, { title, content });
      setSaved(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [title, content, id, initialized]);

  const handleDelete = () => {
    deleteNote(id);
    router.replace("/notes");
  };

  if (!loaded) return null;

  if (!note) {
    return (
      <div className="pt-8 text-center text-[#6e6e73]">
        <p>Nota no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="pt-2 flex flex-col min-h-[calc(100vh-10rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6e6e73]">
            {saved ? "Guardado" : "Guardando..."}
          </span>
          <button
            onClick={handleDelete}
            className="text-[#FF3B30] active:opacity-60 transition-opacity"
            aria-label="Eliminar nota"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* Título: marquee cuando está quieto, input normal cuando está enfocado */}
      <div className="mb-3 w-full">
        {titleFocused ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleFocused(false)}
            placeholder="Título"
            autoFocus
            className="text-2xl font-bold text-[#1d1d1f] bg-transparent border-none outline-none w-full placeholder:text-[#c7c7cc]"
          />
        ) : (
          <div
            onClick={() => setTitleFocused(true)}
            className="cursor-text"
          >
            <MarqueeText
              text={title || "Sin título"}
              className={`text-2xl font-bold ${title ? "text-[#1d1d1f]" : "text-[#c7c7cc]"}`}
            />
          </div>
        )}
      </div>

      {/* Fecha */}
      <p className="text-xs text-[#6e6e73] mb-4">{formatDate(note.updatedAt)}</p>

      {/* Contenido */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Empieza a escribir..."
        className="flex-1 text-[15px] leading-relaxed text-[#1d1d1f] bg-transparent border-none outline-none w-full resize-none placeholder:text-[#c7c7cc]"
        rows={20}
      />
    </div>
  );
}
