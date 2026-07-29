"use client";

import { useRef } from "react";
import { Download, Eye, FileText, FileSpreadsheet, File, Trash2, X } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import type { Document } from "@/types";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import FloatingButton from "@/components/common/FloatingButton";
import SectionTitle from "@/components/common/SectionTitle";
import { useState } from "react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DocIcon({ type }: { type: Document["type"] }) {
  const colors: Record<Document["type"], string> = {
    pdf: "#FF3B30",
    doc: "#0071e3",
    docx: "#0071e3",
    xls: "#34C759",
    xlsx: "#34C759",
    txt: "#8e8e93",
  };
  const color = colors[type];
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${color}15` }}
    >
      {["xls", "xlsx"].includes(type) ? (
        <FileSpreadsheet size={20} style={{ color }} />
      ) : (
        <FileText size={20} style={{ color }} />
      )}
    </div>
  );
}

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.txt";

export default function DocumentsPage() {
  const {
    documents,
    loaded,
    uploading,
    deletingId,
    error,
    clearError,
    addDocument,
    deleteDocument,
  } = useDocuments();
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await addDocument(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  if (!loaded) return null;

  return (
    <div className="pt-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFileChange}
      />

      <SectionTitle title="Documentos" />
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar documentos..." />

      {error && (
        <div role="alert" className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-[#ffebe9] px-3 py-2.5 text-sm text-[#b42318]">
          <span>{error}</span>
          <button onClick={clearError} aria-label="Cerrar error" className="flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      )}
      {uploading && <p className="mt-3 text-sm text-[#6e6e73]">Subiendo documento...</p>}

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={File}
            title={search ? "Sin resultados" : "Sin documentos"}
            description={search ? "No hay documentos que coincidan" : "Pulsa + para añadir un documento"}
          />
        </div>
      ) : (
        <div className="mt-4 bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm overflow-hidden">
          {filtered.map((doc, i) => (
            <div
              key={doc.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i < filtered.length - 1 ? "border-b border-[#f2f2f7]" : ""
              }`}
            >
              <DocIcon type={doc.type} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#1d1d1f] truncate">{doc.name}</p>
                <p className="text-xs text-[#6e6e73] mt-0.5">
                  {formatDate(doc.updatedAt)} · {formatSize(doc.sizeBytes)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir ${doc.name}`}
                    title="Ver documento"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0071e3] active:bg-[#e8f0fd]"
                  >
                    <Eye size={17} />
                  </a>
                )}
                {doc.url && (
                  <a
                    href={doc.url}
                    download={doc.name}
                    aria-label={`Descargar ${doc.name}`}
                    title="Descargar"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0071e3] active:bg-[#e8f0fd]"
                  >
                    <Download size={17} />
                  </a>
                )}
                <button
                  onClick={async () => {
                    if (window.confirm(`¿Eliminar "${doc.name}"?`)) {
                      await deleteDocument(doc.id);
                    }
                  }}
                  disabled={deletingId === doc.id}
                  aria-label={`Eliminar ${doc.name}`}
                  title="Eliminar"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#FF3B30] active:bg-[#ffebe9] disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FloatingButton
        onClick={() => fileInputRef.current?.click()}
        label="Subir documento"
        disabled={uploading}
      />
    </div>
  );
}
