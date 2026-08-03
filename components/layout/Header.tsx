"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
} from "lucide-react";

const sectionTitles: Record<string, string> = {
  "/notes": "Notas",
  "/documents": "Documentos",
  "/images": "Imágenes",
  "/reminders": "Recordatorios",
  "/trash": "Papelera",
};

function getSectionTitle(pathname: string): string | null {
  // Coincidencia exacta primero
  if (sectionTitles[pathname]) return sectionTitles[pathname];
  // Sub-rutas (ej. /notes/abc)
  const base = "/" + pathname.split("/")[1];
  return sectionTitles[base] ?? null;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/dashboard";
  const sectionTitle = getSectionTitle(pathname);

  return (
    <header className={`sc-toolbar app-header-anchor ${isDashboard ? "sc-toolbar-dashboard" : "sc-toolbar-compact sc-toolbar-section"}`}>
      {isDashboard ? (
        <div className="sc-toolbar-title">
          <div className="sc-toolbar-profile-title">
            <span className="sc-toolbar-avatar" aria-hidden="true">
              <span className="sc-toolbar-avatar-fallback">S</span>
              <img
                src="/avatar-stefany.png"
                alt=""
                width={44}
                height={44}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </span>
            <span className="sc-toolbar-title-copy">
              <h1>Hola, Stefy</h1>
              <p>Todo lo importante, siempre contigo.</p>
            </span>
          </div>
        </div>
      ) : (
        <div className="sc-section-toolbar-row">
          <button className="sc-control-pill sc-control-pill-icon sc-back-pill" type="button" onClick={() => router.back()} aria-label="Volver">
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div className="sc-toolbar-title sc-section-title">
            <h1>{sectionTitle ?? "Atrás"}</h1>
          </div>
          <button className="sc-control-pill sc-control-pill-icon" type="button" aria-label="Buscar">
            <Search size={17} aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
}
