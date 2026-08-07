"use client";

import { useEffect, useRef, useState } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleFavorite = async () => {
    await onFavorite();
    setOpen(false);
  };

  const handleDelete = async () => {
    await onDelete();
    setOpen(false);
  };

  return (
    <div className="sc-item-actions" ref={menuRef}>
      <button
        type="button"
        className="sc-item-actions-trigger"
        aria-label={`Abrir acciones de ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Ellipsis size={20} aria-hidden="true" />
      </button>

      {open && (
        <div className="sc-item-actions-popover" role="menu" aria-label={`Acciones de ${label}`}>
          {viewHref ? (
            viewExternal ? (
              <a
                href={viewHref}
                target="_blank"
                rel="noreferrer"
                className="sc-item-action sc-item-action-view"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <Eye size={16} aria-hidden="true" />
                <span>Visualizar</span>
              </a>
            ) : (
              <Link
                href={viewHref}
                className="sc-item-action sc-item-action-view"
                role="menuitem"
                onClick={() => setOpen(false)}
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
              onClick={() => setOpen(false)}
            >
              <Download size={16} aria-hidden="true" />
              <span>Descargar</span>
            </a>
          ) : null}

          <button
            type="button"
            className="sc-item-action sc-item-action-favorite"
            role="menuitem"
            aria-pressed={favoriteActive}
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
