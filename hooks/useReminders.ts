"use client";

import { useState, useEffect } from "react";
import type { Reminder, ReminderGroup, Priority } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const OPTS = { credentials: "include" as RequestCredentials };

function getGroup(dateStr: string): ReminderGroup {
  const today = new Date();
  const target = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "today";
  if (diff === 1) return "tomorrow";
  return "upcoming";
}

export interface NewReminderInput {
  title: string;
  description?: string;
  date: string;
  time?: string;
  priority: Priority;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchReminders = async () => {
    try {
      const res = await fetch(`${API_URL}/reminders/`, OPTS);
      if (res.ok) {
        const data = await res.json();
        // El backend devuelve group_name, la UI espera group
        const mapped = data.map((r: any) => ({
          ...r,
          group: r.group_name ?? getGroup(r.date),
        }));
        setReminders(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const createReminder = async (input: NewReminderInput) => {
    try {
      const payload = { ...input, group_name: getGroup(input.date) };
      const res = await fetch(`${API_URL}/reminders/`, {
        ...OPTS,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newReminder = await res.json();
        setReminders((prev) => [...prev, { ...newReminder, group: newReminder.group_name ?? getGroup(newReminder.date) }]);
        return newReminder;
      }
    } catch (error) {
      console.error("Failed to create reminder:", error);
    }
  };

  const toggleCompleted = async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;
    
    // Optimistic UI
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)));
    
    try {
      await fetch(`${API_URL}/reminders/${id}`, {
        ...OPTS,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !reminder.completed }),
      });
    } catch (error) {
      console.error("Failed to toggle reminder:", error);
    }
  };

  const deleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`${API_URL}/reminders/${id}`, { ...OPTS, method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete reminder:", error);
    }
  };

  return { reminders, loaded, createReminder, toggleCompleted, deleteReminder };
}
