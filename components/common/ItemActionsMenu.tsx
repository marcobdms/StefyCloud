"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Ellipsis, Eye, Star, Trash2 } from "lucide-react";

interface ItemActionsMenuProps {
  label: string;
  viewHref?: string;
  viewExternal?: boolean;
  downloadHref?: string;
  downloadFilename?: string;
  favoriteActive?: boolean;
  favoriteDisabled?: boolean;
  favoriteLabel?: string;
  deleteLabel?: string;
  deleting?: boolean;
  onFavorite: () => void | Promise<unknown>;
  onDelete: () => void | Promise<unknown>;
}

export default function ItemActionsMenu({
  label,
  viewHref,
  viewExternal = false,
  downloadHref,
  downloadFilename,
  favoriteActive = false,
  favoriteDisabled = false,
  favoriteLabel = "Añadir a favoritos",
  deleteLabel = "Borrar",
  deleting = false,
  onFavorite,
  onDelete,
}: ItemActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeMenu = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      closeTimerRef.current = null;
    }, 150);
  }, [closing, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const toggleMenu = () => {
    if (open) {
      closeMenu();
      return;
    }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    setClosing(false);
    setOpen(true);
  };

  const handleFavorite = async () => {
    await onFavorite();
    closeMenu();
  };

  const handleDelete = async () => {
    await onDelete();
    closeMenu();
  };

  return (
    <div className="sc-item-actions" ref={menuRef}>
      <button
        type="button"
        className="sc-item-actions-trigger"
        aria-label={`Abrir acciones de ${label}`}
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <Ellipsis size={20} aria-hidden="true" />
      </button>

      {open && (
        <div
          className={`sc-item-actions-popover ${closing ? "sc-item-actions-popover-closing" : ""}`}
          role="menu"
          aria-label={`Acciones de ${label}`}
        >
          {viewHref ? (
            viewExternal ? (
              <a
                href={viewHref}
                target="_blank"
                rel="noreferrer"
                className="sc-item-action sc-item-action-view"
                role="menuitem"
                onClick={closeMenu}
              >
                <Eye size={16} aria-hidden="true" />
                <span>Visualizar</span>
              </a>
            ) : (
              <Link
                href={viewHref}
                className="sc-item-action sc-item-action-view"
                role="menuitem"
                onClick={closeMenu}
              >
                <Eye size={16} aria-hidden="true" />
                <span>Visualizar</span>
              </Link>
            )
          ) : null}

          {downloadHref ? (
            <a
              href={downloadHref}
              download={downloadFilename}
              className="sc-item-action sc-item-action-download"
              role="menuitem"
              onClick={closeMenu}
            >
              <Download size={16} aria-hidden="true" />
              <span>Descargar</span>
            </a>
          ) : null}

          <button
            type="button"
            className="sc-item-action sc-item-action-favorite"
            role="menuitemcheckbox"
            aria-checked={favoriteActive}
            disabled={favoriteDisabled}
            onClick={() => void handleFavorite()}
          >
            <Star size={16} fill={favoriteActive ? "currentColor" : "none"} aria-hidden="true" />
            <span>{favoriteLabel}</span>
          </button>

          <button
            type="button"
            className="sc-item-action sc-item-action-delete"
            role="menuitem"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            <Trash2 size={16} aria-hidden="true" />
            <span>{deleting ? "Borrando..." : deleteLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
