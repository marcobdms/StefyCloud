"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const sectionTitles: Record<string, string> = {
  "/notes": "Notas",
  "/documents": "Documentos",
  "/images": "Imágenes",
  "/reminders": "Recordatorios",
  "/favorites": "Favoritos",
  "/trash": "Papelera",
  "/search": "Buscar",
};

function getSectionTitle(pathname: string): string | null {
  // Coincidencia exacta primero
  if (sectionTitles[pathname]) return sectionTitles[pathname];
  // Sub-rutas (ej. /notes/abc)
  const base = "/" + pathname.split("/")[1];
  return sectionTitles[base] ?? null;
}

function getBackHref(pathname: string): string | null {
  if (pathname === "/dashboard") return null;

  const base = "/" + pathname.split("/")[1];
  if (base !== pathname && sectionTitles[base]) return base;

  return "/dashboard";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/dashboard";
  const sectionTitle = getSectionTitle(pathname);
  const backHref = getBackHref(pathname);

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
          {backHref ? (
            <Link
              href={backHref}
              transitionTypes={["nav-back"]}
              className="sc-control-pill sc-control-pill-icon sc-back-pill"
              aria-label="Volver"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </Link>
          ) : (
            <button className="sc-control-pill sc-control-pill-icon sc-back-pill" type="button" onClick={() => router.back()} aria-label="Volver">
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
          )}
          <div className="sc-toolbar-title sc-section-title">
            <h1>{sectionTitle ?? "Atrás"}</h1>
          </div>
        </div>
      )}
    </header>
  );
}
