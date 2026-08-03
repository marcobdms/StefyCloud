"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, FileText, House, Images, StickyNote } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/notes", label: "Notas", icon: StickyNote },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/images", label: "Imágenes", icon: Images },
  { href: "/reminders", label: "Recordatorios", icon: Bell },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación móvil" className="sc-mobile-tabbar app-nav-anchor safe-bottom">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            transitionTypes={["section-nav"]}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={isActive ? "sc-tab-selected" : ""}
          >
            <Icon size={24} strokeWidth={2.25} absoluteStrokeWidth aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
