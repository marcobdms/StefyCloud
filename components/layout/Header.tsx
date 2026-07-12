"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const sectionTitles: Record<string, string> = {
  "/notes": "Notas",
  "/documents": "Documentos",
  "/images": "Imágenes",
  "/reminders": "Recordatorios",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "Buenos días";
  if (hour >= 14 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

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
    <header className="sticky top-0 z-40 bg-[#f5f5f7]/90 backdrop-blur-md">
      <div className="max-w-[500px] mx-auto px-5 pt-4 pb-3">
        {isDashboard ? (
          <>
            <p className="text-sm text-[#6e6e73]">{getGreeting()}</p>
            <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
              Stefany
            </h1>
          </>
        ) : (
          <div className="flex items-center gap-1 -ml-1">
            <button
              onClick={() => router.back()}
              className="flex items-center text-[#0071e3] active:opacity-60 transition-opacity p-1"
              aria-label="Volver"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <h1 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
              {sectionTitle ?? "Atrás"}
            </h1>
          </div>
        )}
      </div>
    </header>
  );
}
