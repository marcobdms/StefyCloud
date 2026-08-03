"use client";

import { useState } from "react";
import {
  Bell,
  FileText,
  Image,
  RotateCcw,
  StickyNote,
  Trash2,
} from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import SectionTitle from "@/components/common/SectionTitle";
import { useTrash } from "@/hooks/useTrash";
import type { TrashItemType } from "@/types";

const typeConfig: Record<TrashItemType, { label: string; icon: typeof StickyNote; color: string }> = {
  note: { label: "Nota", icon: StickyNote, color: "#FFD60A" },
  document: { label: "Documento", icon: FileText, color: "#34C759" },
  image: { label: "Imagen", icon: Image, color: "#FF9500" },
  reminder: { label: "Recordatorio", icon: Bell, color: "#0071e3" },
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysLeftText(daysLeft: number) {
  if (daysLeft <= 0) return "Caduca hoy";
  if (daysLeft === 1) return "Queda 1 día";
  return `Quedan ${daysLeft} días`;
}

export default function TrashPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    items,
    loaded,
    actingId,
    error,
    restoreItem,
    permanentlyDeleteItem,
  } = useTrash();

  const handleRestore = async (id: string) => {
    setSuccessMessage(null);
    const restored = await restoreItem(id);
    if (restored) setSuccessMessage("Archivo restaurado");
  };

  const handlePermanentDelete = (id: string) => {
    setSuccessMessage(null);
    const confirmed = window.confirm(
      "Esto eliminará el elemento definitivamente. ¿Quieres continuar?",
    );
    if (!confirmed) return;
    void permanentlyDeleteItem(id);
  };

  return (
    <div className="page-animate pt-2 pb-8">
      <SectionTitle title="Papelera" />

      <div className="bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm px-4 py-3 mb-4">
        <p className="text-sm text-[#6e6e73]">
          Los elementos borrados se conservan durante 10 días antes de eliminarse definitivamente.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-[16px] border border-[#ff3b30]/20 bg-[#ff3b30]/10 px-4 py-3 text-sm text-[#b42318]"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-[16px] border border-[#34c759]/20 bg-[#34c759]/10 px-4 py-3 text-sm font-medium text-[#1f8f3a]"
        >
          {successMessage}
        </div>
      )}

      {!loaded ? (
        <div className="text-center text-sm text-[#6e6e73] py-10">Cargando papelera...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Papelera vacía"
        />
      ) : (
        <div className="bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm overflow-hidden">
          {items.map((item, index) => {
            const config = typeConfig[item.itemType];
            const Icon = config.icon;
            const isActing = actingId === item.id;

            return (
              <div
                key={item.id}
                className={`px-4 py-4 ${
                  index < items.length - 1 ? "border-b border-[#f2f2f7]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <Icon size={19} style={{ color: config.color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#6e6e73] mt-0.5">
                      {config.label} · borrado {formatDate(item.deletedAt)}
                    </p>
                    <p className="text-xs text-[#ff9500] mt-1">
                      {getDaysLeftText(item.daysLeft)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => void handleRestore(item.id)}
                    disabled={isActing}
                    className="h-10 rounded-[14px] bg-[#f5f5f7] text-[#0071e3] text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <RotateCcw size={15} />
                    Restaurar
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePermanentDelete(item.id)}
                    disabled={isActing}
                    className="h-10 rounded-[14px] bg-[#ff3b30]/10 text-[#ff3b30] text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
