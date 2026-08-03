"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { File, FileText, House, Image, Search } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/notes", label: "Notas", icon: File },
  { href: "/documents", label: "Docs", icon: FileText },
  { href: "/images", label: "Imágenes", icon: Image },
];

function getActiveIndex(pathname: string) {
  return navItems.findIndex(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
}

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = getActiveIndex(pathname);
  const [indicatorIndex, setIndicatorIndex] = useState(activeIndex);

  useEffect(() => {
    setIndicatorIndex(activeIndex);
  }, [activeIndex]);

  return (
    <nav aria-label="Navegación móvil" className="sc-mobile-nav-shell safe-bottom">
      <div className={`sc-mobile-tabbar ${indicatorIndex >= 0 ? `sc-mobile-tabbar-active-${indicatorIndex}` : ""}`}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const moveIndicator = () => setIndicatorIndex(navItems.findIndex((item) => item.href === href));

          return (
            <Link
              key={href}
              href={href}
              transitionTypes={["section-nav"]}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "sc-tab-selected" : ""}
              onPointerDown={moveIndicator}
              onClick={moveIndicator}
            >
              <Icon size={26} strokeWidth={2.35} absoluteStrokeWidth aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
      <Link
        href="/search"
        transitionTypes={["section-nav"]}
        className="sc-mobile-search-button"
        aria-label="Buscar"
        aria-current={pathname === "/search" ? "page" : undefined}
      >
        <Search size={31} strokeWidth={2.35} absoluteStrokeWidth aria-hidden="true" />
      </Link>
    </nav>
  );
}
