"use client";

import Link from "next/link";
import { StickyNote, FileText, Image, Bell, ChevronRight, ArrowRight } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { useDocuments } from "@/hooks/useDocuments";
import { useImages } from "@/hooks/useImages";
import { useReminders } from "@/hooks/useReminders";
import SectionTitle from "@/components/common/SectionTitle";

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const { notes } = useNotes();
  const { documents } = useDocuments();
  const { images } = useImages();
  const { reminders } = useReminders();

  const pendingReminders = reminders.filter((r) => !r.completed).length;

  const summaryItems = [
    { label: "Notas", count: notes.length, icon: StickyNote, color: "#FFD60A", href: "/notes" },
    { label: "Documentos", count: documents.length, icon: FileText, color: "#34C759", href: "/documents" },
    { label: "Imágenes", count: images.length, icon: Image, color: "#FF9500", href: "/images" },
    { label: "Pendientes", count: pendingReminders, icon: Bell, color: "#0071e3", href: "/reminders" },
  ];

  const quickActions = [
    { label: "Nueva Nota", icon: StickyNote, href: "/notes" },
    { label: "Documento", icon: FileText, href: "/documents" },
    { label: "Imagen", icon: Image, href: "/images" },
    { label: "Recordatorio", icon: Bell, href: "/reminders" },
  ];

  // Recent activity: last 5 items across notes and docs
  const recentActivity = [
    ...notes.map((n) => ({ id: n.id, name: n.title || "Sin título", date: n.updatedAt, type: "note" as const })),
    ...documents.map((d) => ({ id: d.id, name: d.name, date: d.updatedAt, type: "doc" as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="pt-2">
      {/* Summary */}
      <SectionTitle title="Resumen" />
      <div className="grid grid-cols-2 gap-3">
        {summaryItems.map(({ label, count, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-[20px] p-4 shadow-sm border border-[#e5e5ea] flex flex-col gap-3 active:scale-[0.98] transition-transform duration-200"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1d1d1f]">{count}</p>
              <p className="text-sm text-[#6e6e73]">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <SectionTitle title="Acciones rápidas" />
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-[16px] px-4 py-3 shadow-sm border border-[#e5e5ea] flex items-center gap-3 active:scale-[0.98] transition-transform duration-200"
          >
            <Icon size={18} className="text-[#0071e3]" />
            <span className="text-sm font-medium text-[#1d1d1f]">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <SectionTitle
        title="Actividad reciente"
        action={
          <Link href="/notes" className="text-sm text-[#0071e3] flex items-center gap-1">
            Ver todo <ArrowRight size={14} />
          </Link>
        }
      />
      {recentActivity.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm px-4 py-8 text-center">
          <p className="text-sm text-[#6e6e73]">Aún no hay actividad reciente</p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm overflow-hidden">
          {recentActivity.map((item, i) => (
            <Link
              key={item.id + item.type}
              href={item.type === "note" ? `/notes/${item.id}` : `/documents`}
              className={`flex items-center gap-3 px-4 py-3.5 active:bg-[#f5f5f7] transition-colors ${
                i < recentActivity.length - 1 ? "border-b border-[#f2f2f7]" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                {item.type === "note" ? (
                  <StickyNote size={15} className="text-[#6e6e73]" />
                ) : (
                  <FileText size={15} className="text-[#6e6e73]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1d1d1f] truncate">{item.name}</p>
                <p className="text-xs text-[#6e6e73]">{formatDate(item.date)}</p>
              </div>
              <ChevronRight size={15} className="text-[#c7c7cc] flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
