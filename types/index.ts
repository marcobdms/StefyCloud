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
  timezone?: string;
  notifiedAt?: string;
  priority: Priority;
  group: ReminderGroup;
}

export type TrashItemType = "note" | "document" | "image" | "reminder";
export type ActivityAction =
  | "created"
  | "deleted"
  | "restored"
  | "permanently_deleted"
  | "purged";

export interface TrashItem {
  id: string;
  itemType: TrashItemType;
  itemId: string;
  title: string;
  deletedAt: string;
  expiresAt: string;
  daysLeft: number;
}

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  itemType: TrashItemType;
  itemId?: string;
  title: string;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  itemType: TrashItemType;
  itemId: string;
  title: string;
  targetUrl?: string;
  createdAt: string;
}
