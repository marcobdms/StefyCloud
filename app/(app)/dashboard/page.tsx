"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Bell,
  Camera,
  CheckCheck,
  ChevronRight,
  Columns3,
  Ellipsis,
  File,
  FileText,
  Files,
  Image,
  ImagePlus,
  NotebookPen,
  Plus,
  SquarePen,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useDocuments } from "@/hooks/useDocuments";
import { useImages } from "@/hooks/useImages";
import { useNotes } from "@/hooks/useNotes";
import { useReminders } from "@/hooks/useReminders";
import { API_URL } from "@/lib/api";
import { clearAuthCookie, getAuthHeaders } from "@/lib/auth";
import type { ActivityAction, TrashItemType } from "@/types";

const activityTypeConfig: Record<TrashItemType, { label: string; icon: typeof NotebookPen; className: string }> = {
  note: { label: "Nota", icon: NotebookPen, className: "" },
  document: { label: "Documento", icon: FileText, className: "sc-activity-symbol-doc" },
  image: { label: "Imagen", icon: Image, className: "sc-activity-symbol-image" },
  reminder: { label: "Recordatorio", icon: CheckCheck, className: "" },
};

const actionLabels: Record<ActivityAction, string> = {
  created: "Añadido",
  deleted: "Movido a papelera",
  restored: "Restaurado",
  permanently_deleted: "Eliminado definitivamente",
  purged: "Purgado automáticamente",
};

function formatActivityDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Hoy, ${time}`;
  if (diffDays === 1) return "Ayer";
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"summary" | "activity">("summary");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isNewModalClosing, setIsNewModalClosing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const newModalRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNewModalOpenRef = useRef(false);
  const isNewModalClosingRef = useRef(false);
  const { notes, createNote } = useNotes();
  const { documents, addDocument } = useDocuments();
  const { images, addImage } = useImages();
  const { reminders } = useReminders();
  const { activity } = useActivityLog(4);
  const logout = () => {
    fetch(`${API_URL}/auth/logout`, { method: "POST", headers: getAuthHeaders() }).catch(() => { });
    clearAuthCookie();
  };

  const openNewModal = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    isNewModalOpenRef.current = true;
    isNewModalClosingRef.current = false;
    setIsNewModalClosing(false);
    setIsNewModalOpen(true);
  }, []);

  const closeNewModal = useCallback(() => {
    if (!isNewModalOpenRef.current || isNewModalClosingRef.current) return;

    isNewModalClosingRef.current = true;
    setIsNewModalClosing(true);

    closeTimerRef.current = setTimeout(() => {
      isNewModalOpenRef.current = false;
      isNewModalClosingRef.current = false;
      setIsNewModalOpen(false);
      setIsNewModalClosing(false);
      closeTimerRef.current = null;
    }, 180);
  }, []);

  useEffect(() => {
    isNewModalOpenRef.current = isNewModalOpen;
  }, [isNewModalOpen]);

  useEffect(() => {
    isNewModalClosingRef.current = isNewModalClosing;
  }, [isNewModalClosing]);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".app-header-anchor");

    document.documentElement.classList.toggle("sc-new-modal-active", isNewModalOpen);
    document.body.classList.toggle("sc-new-modal-active", isNewModalOpen);
    header?.classList.toggle("sc-header-modal-blur", isNewModalOpen);

    return () => {
      document.documentElement.classList.remove("sc-new-modal-active");
      document.body.classList.remove("sc-new-modal-active");
      header?.classList.remove("sc-header-modal-blur");
    };
  }, [isNewModalOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isNewModalOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstButton = newModalRef.current?.querySelector<HTMLButtonElement>("button");
    firstButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNewModal();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [closeNewModal, isNewModalOpen]);

  const handleCameraFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const uploaded = await addImage(file);
    if (uploaded) router.push("/images");
  };

  const handlePdfFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const uploaded = await addDocument(file);
    if (uploaded) router.push("/documents");
  };

  const handleCreateNote = async () => {
    closeNewModal();
    const note = await createNote();
    if (note?.id) router.push(`/notes/${note.id}`);
  };

  const handleOpenReminderForm = () => {
    closeNewModal();
    router.push("/reminders?new=1");
  };

  const pendingReminders = reminders.filter((reminder) => !reminder.completed).length;
  const usedBytes = documents.reduce((total, document) => total + (document.sizeBytes ?? 0), 0);
  const storageQuotaBytes = 25 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, (usedBytes / storageQuotaBytes) * 100);

  const widgets = [
    {
      href: "/notes",
      label: "Notas",
      value: notes.length,
      icon: NotebookPen,
      className: "sc-widget-notes",
    },
    {
      href: "/documents",
      label: "Documentos",
      value: documents.length,
      icon: Files,
      className: "sc-widget-docs",
    },
    {
      href: "/images",
      label: "Imágenes",
      value: images.length,
      icon: Image,
      className: "sc-widget-images",
    },
    {
      href: "/reminders",
      label: "Recordatorios",
      value: pendingReminders,
      icon: Bell,
      className: "sc-widget-reminders",
    },
  ];

  return (
    <div className={`sc-dashboard-page page-animate ${isNewModalOpen ? "sc-new-modal-visible" : ""}`}>
      <input
        ref={cameraInputRef}
        className="sc-hidden-file-input"
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        onChange={handleCameraFileChange}
      />
      <input
        ref={pdfInputRef}
        className="sc-hidden-file-input"
        type="file"
        accept="application/pdf,.pdf"
        tabIndex={-1}
        onChange={handlePdfFileChange}
      />

      <div className="sc-dashboard-underlay" aria-hidden={isNewModalOpen || undefined}>
        <div className="sc-overview-head">
        <div
          className={`sc-segmented ${activeView === "activity" ? "sc-segmented-activity" : ""}`}
          role="group"
          aria-label="Vista del dashboard"
        >
          <button
            className={activeView === "summary" ? "sc-segment-selected" : ""}
            type="button"
            aria-pressed={activeView === "summary"}
            onClick={() => setActiveView("summary")}
          >
            Resumen
          </button>
          <button
            className={activeView === "activity" ? "sc-segment-selected" : ""}
            type="button"
            aria-pressed={activeView === "activity"}
            onClick={() => setActiveView("activity")}
          >
            Actividad
          </button>
        </div>
        <div className="sc-overview-actions">
          <button className="sc-control-pill sc-control-pill-icon sc-overview-control sc-desktop-action" type="button" aria-label="Vista de columnas">
            <Columns3 size={17} aria-hidden="true" />
          </button>
          <button className="sc-control-pill sc-control-pill-icon sc-overview-control sc-desktop-action" type="button" aria-label="Ordenar">
            <ArrowUpDown size={17} aria-hidden="true" />
          </button>
          <button
            className="sc-primary-action sc-primary-action-compact"
            type="button"
            onClick={openNewModal}
          >
            <Plus size={17} aria-hidden="true" />
            <span>Nuevo</span>
          </button>
          <Link
            href="/trash"
            className="sc-control-pill sc-control-pill-icon sc-overview-control"
            transitionTypes={["section-nav"]}
            aria-label="Papelera"
          >
            <Trash2 size={17} aria-hidden="true" />
          </Link>
          <button className="sc-control-pill sc-control-pill-icon sc-overview-control" type="button" onClick={logout} aria-label="Cerrar sesión">
            <Ellipsis size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {activeView === "summary" ? (
        <div className="sc-content-grid sc-dashboard-panel">
          <section className="sc-column" aria-labelledby="sc-space-title">
            <div className="sc-block-title">
              <h2 id="sc-space-title">Tu espacio</h2>
            </div>

            <div className="sc-widget-grid">
              {widgets.map(({ href, label, value, icon: Icon, className }) => (
                <Link
                  key={label}
                  href={href}
                  transitionTypes={["section-nav"]}
                  className={`sc-widget ${className}`}
                >
                  <span className="sc-widget-label">{label}</span>
                  <strong className="sc-widget-value">{value}</strong>
                  <span className="sc-widget-icon">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="sc-quick-list" aria-label="Acciones rápidas">
              <Link href="/notes" className="sc-quick-row" transitionTypes={["section-nav"]}>
                <SquarePen size={17} aria-hidden="true" />
                <span>Nueva nota</span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/documents" className="sc-quick-row" transitionTypes={["section-nav"]}>
                <FileText size={17} aria-hidden="true" />
                <span>Subir documento</span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/images" className="sc-quick-row" transitionTypes={["section-nav"]}>
                <ImagePlus size={17} aria-hidden="true" />
                <span>Subir imagen</span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/favorites" className="sc-quick-row" transitionTypes={["section-nav"]}>
                <Star size={17} aria-hidden="true" />
                <span>Favoritos</span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="sc-block-title sc-storage-title">
              <h2 id="sc-storage-title">Almacenamiento</h2>
            </div>

            <div className="sc-storage sc-storage-standalone">
              <div className="sc-storage-head">
                <strong>Uso actual</strong>
                <span>
                  {formatBytes(usedBytes)} de {formatBytes(storageQuotaBytes)}
                </span>
              </div>
              <div
                className="sc-storage-track"
                aria-label={`${storagePercent.toFixed(1)} % del almacenamiento utilizado`}
              >
                <div className="sc-storage-fill" style={{ width: `${storagePercent}%` }} />
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className="sc-activity-panel sc-dashboard-panel" aria-labelledby="sc-recent-title">
          <div className="sc-block-title">
            <h2 id="sc-recent-title">Actividad reciente</h2>
            <span className="sc-block-title-link">Ver todo</span>
          </div>

          <div className="sc-activity-list">
            {activity.length === 0 ? (
              <article className="sc-activity-row">
                <span className="sc-activity-symbol">
                  <NotebookPen size={16} aria-hidden="true" />
                </span>
                <span className="sc-activity-copy">
                  <strong>Aún no hay actividad reciente</strong>
                  <small>Cuando guardes algo, aparecerá aquí.</small>
                </span>
              </article>
            ) : (
              activity.map((entry) => {
                const config = activityTypeConfig[entry.itemType];
                const Icon = config.icon;

                return (
                  <article className="sc-activity-row" key={entry.id}>
                    <span className={`sc-activity-symbol ${config.className}`}>
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="sc-activity-copy">
                      <strong>{entry.title}</strong>
                      <small>
                        {actionLabels[entry.action]} · {formatActivityDate(entry.createdAt)}
                      </small>
                    </span>
                    <ChevronRight className="sc-chevron" size={16} aria-hidden="true" />
                  </article>
                );
              })
            )}
          </div>
        </section>
        )}
      </div>

      {isNewModalOpen && (
        <div
          className={`sc-action-modal-backdrop ${isNewModalClosing ? "sc-action-modal-closing" : ""}`}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeNewModal();
          }}
        >
          <div
            ref={newModalRef}
            className="sc-action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sc-new-action-title"
          >
            <div className="sc-action-modal-head">
              <div>
                <p id="sc-new-action-title">Nuevo</p>
                <span>Elige qué quieres añadir</span>
              </div>
              <button
                className="sc-action-modal-close"
                type="button"
                onClick={closeNewModal}
                aria-label="Cerrar menú de nuevo"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="sc-action-modal-list">
              <button
                className="sc-action-modal-row"
                type="button"
                onClick={() => {
                  closeNewModal();
                  cameraInputRef.current?.click();
                }}
              >
                <span className="sc-action-modal-icon sc-action-modal-icon-image">
                  <Camera size={19} aria-hidden="true" />
                </span>
                <span>Tomar foto</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
              <button
                className="sc-action-modal-row"
                type="button"
                onClick={() => {
                  closeNewModal();
                  pdfInputRef.current?.click();
                }}
              >
                <span className="sc-action-modal-icon sc-action-modal-icon-doc">
                  <File size={19} aria-hidden="true" />
                </span>
                <span>Subir PDF</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
              <button
                className="sc-action-modal-row"
                type="button"
                onClick={() => {
                  void handleCreateNote();
                }}
              >
                <span className="sc-action-modal-icon sc-action-modal-icon-note">
                  <SquarePen size={19} aria-hidden="true" />
                </span>
                <span>Añadir nota</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
              <button
                className="sc-action-modal-row"
                type="button"
                onClick={handleOpenReminderForm}
              >
                <span className="sc-action-modal-icon sc-action-modal-icon-reminder">
                  <Bell size={19} aria-hidden="true" />
                </span>
                <span>Añadir recordatorio</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
