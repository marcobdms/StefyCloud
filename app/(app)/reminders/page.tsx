"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, Circle, CheckCircle2, X } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import type { Reminder, ReminderGroup, Priority } from "@/types";
import type { NewReminderInput } from "@/hooks/useReminders";
import EmptyState from "@/components/common/EmptyState";
import FloatingButton from "@/components/common/FloatingButton";
import SectionTitle from "@/components/common/SectionTitle";

const groupLabels: Record<ReminderGroup, string> = {
  today: "Hoy",
  tomorrow: "Mañana",
  upcoming: "Próximos",
};

const priorityColors: Record<Priority, string> = {
  high: "#FF3B30",
  medium: "#FF9500",
  low: "#34C759",
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function ReminderItem({
  reminder,
  onToggle,
}: {
  reminder: Reminder;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <button
        onClick={() => onToggle(reminder.id)}
        className="flex-shrink-0 transition-transform duration-150 active:scale-90"
      >
        {reminder.completed ? (
          <CheckCircle2 size={22} className="text-[#0071e3]" />
        ) : (
          <Circle size={22} className="text-[#c7c7cc]" />
        )}
      </button>
      <Link href={`/reminders/${reminder.id}`} className="flex-1 min-w-0">
        <p
          className={`text-[15px] font-medium truncate ${
            reminder.completed ? "line-through text-[#8e8e93]" : "text-[#1d1d1f]"
          }`}
        >
          {reminder.title}
        </p>
        {reminder.time && (
          <p className="text-xs text-[#6e6e73] mt-0.5">{reminder.time}</p>
        )}
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: priorityColors[reminder.priority] }}
        />
        <ChevronRight size={15} className="text-[#c7c7cc]" />
      </div>
    </div>
  );
}

// Simple inline new reminder form
function NewReminderForm({
  onSave,
  onCancel,
}: {
  onSave: (input: NewReminderInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), date, time: time || undefined, priority });
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm p-4 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Nuevo recordatorio</h3>
        <button onClick={onCancel} className="text-[#6e6e73] active:opacity-60">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué tienes que recordar?"
          className="w-full bg-[#f5f5f7] rounded-xl px-3 py-2.5 text-[15px] text-[#1d1d1f] placeholder:text-[#6e6e73] outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-[#6e6e73] font-medium mb-1 block">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#f5f5f7] rounded-xl px-3 py-2 text-[14px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#6e6e73] font-medium mb-1 block">Hora (opcional)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-[#f5f5f7] rounded-xl px-3 py-2 text-[14px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition"
            />
          </div>
        </div>

        {/* Priority selector */}
        <div>
          <label className="text-[11px] text-[#6e6e73] font-medium mb-1 block">Prioridad</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  priority === p
                    ? "text-white border-transparent"
                    : "bg-[#f5f5f7] text-[#6e6e73] border-transparent"
                }`}
                style={priority === p ? { backgroundColor: priorityColors[p] } : {}}
              >
                {p === "low" ? "Baja" : p === "medium" ? "Media" : "Alta"}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!title.trim()}
          className="w-full bg-[#0071e3] text-white rounded-xl py-2.5 text-[15px] font-semibold mt-1 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}

export default function RemindersPage() {
  const { reminders, loaded, createReminder, toggleCompleted } = useReminders();
  const [showForm, setShowForm] = useState(false);

  const groups: ReminderGroup[] = ["today", "tomorrow", "upcoming"];
  const grouped = groups
    .map((group) => ({ group, items: reminders.filter((r) => r.group === group) }))
    .filter((g) => g.items.length > 0);

  const handleSave = (input: NewReminderInput) => {
    createReminder(input);
    setShowForm(false);
  };

  if (!loaded) return null;

  return (
    <div className="pt-2">
      <SectionTitle title="Recordatorios" />

      {showForm && (
        <NewReminderForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      {grouped.length === 0 && !showForm ? (
        <EmptyState
          icon={Bell}
          title="Sin recordatorios"
          description="Pulsa + para añadir tu primer recordatorio"
        />
      ) : (
        grouped.map(({ group, items }) => (
          <div key={group} className="mb-5">
            <h3 className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide mb-2 px-1">
              {groupLabels[group]}
            </h3>
            <div className="bg-white rounded-[20px] border border-[#e5e5ea] shadow-sm overflow-hidden">
              {items.map((reminder, i) => (
                <div
                  key={reminder.id}
                  className={i < items.length - 1 ? "border-b border-[#f2f2f7]" : ""}
                >
                  <ReminderItem reminder={reminder} onToggle={toggleCompleted} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <FloatingButton onClick={() => setShowForm(true)} label="Nuevo recordatorio" />
    </div>
  );
}
