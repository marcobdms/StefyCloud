// types/index.ts — Shared types for Stefany Cloud
// These types mirror the future FastAPI/Pydantic schemas

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: "pdf" | "doc" | "docx" | "xls" | "xlsx" | "txt";
  sizeBytes: number;
  updatedAt: string;
  url?: string;
}

export interface CloudImage {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  createdAt: string;
}

export type Priority = "low" | "medium" | "high";
export type ReminderGroup = "today" | "tomorrow" | "upcoming";

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string; // ISO date string
  time?: string; // "HH:MM"
  priority: Priority;
  group: ReminderGroup;
}
