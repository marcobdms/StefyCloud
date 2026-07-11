"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, Clock, Flag, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import type { Reminder, Priority } from "@/types";

const priorityLabels: Record<Priority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const priorityColors: Record<Priority, string> = {
  high: "#FF3B30",
  medium: "#FF9500",
  low: "#34C759",
};

export default function ReminderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { reminders, loaded, toggleCompleted, deleteReminder } = useReminders();

  const reminder = reminders.find((r) => r.id === id);

  if (!loaded) return null;

  if (!reminder) {
    return (
      <div className="pt-8 text-center text-[#6e6e73]">
        <p>Recordatorio no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[#0071e3] text-sm font-medium active:opacity-60 transition-opacity"
        >
          <ChevronLeft size={18} />
          Recordatorios
        </button>
        <button
          onClick={() => { deleteReminder(id); router.replace("/reminders"); }}
          className="text-[#FF3B30] active:opacity-60 transition-opacity"
          aria-label="Eliminar"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {/* Title + toggle */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => toggleCompleted(id)}
          className="mt-1 transition-transform duration-150 active:scale-90"
        >
          {reminder.completed ? (
            <CheckCircle2 size={26} className="text-[#0071e3]" />
          ) : (
            <Circle size={26} className="text-[#c7c7cc]" />
          )}
        </button>
        <h2
          className={`text-2xl font-bold text-[#1d1d1f] ${
            reminder.completed ? "line-through text-[#8e8e93]" : ""
          }`}
        >
          {reminder.title}
        </h2>
      </div>

      {/* Details */}
      <div className="bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm overflow-hidden">
        {reminder.description && (
          <div className="px-4 py-4 border-b border-[#f2f2f7]">
            <p className="text-sm text-[#6e6e73] leading-relaxed">{reminder.description}</p>
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f2f2f7]">
          <Calendar size={17} className="text-[#6e6e73] flex-shrink-0" />
          <div>
            <p className="text-[13px] text-[#6e6e73]">Fecha</p>
            <p className="text-[15px] font-medium text-[#1d1d1f]">
              {new Date(reminder.date + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {reminder.time && (
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f2f2f7]">
            <Clock size={17} className="text-[#6e6e73] flex-shrink-0" />
            <div>
              <p className="text-[13px] text-[#6e6e73]">Hora</p>
              <p className="text-[15px] font-medium text-[#1d1d1f]">{reminder.time}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3.5">
          <Flag size={17} style={{ color: priorityColors[reminder.priority] }} className="flex-shrink-0" />
          <div>
            <p className="text-[13px] text-[#6e6e73]">Prioridad</p>
            <p className="text-[15px] font-medium" style={{ color: priorityColors[reminder.priority] }}>
              {priorityLabels[reminder.priority]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
