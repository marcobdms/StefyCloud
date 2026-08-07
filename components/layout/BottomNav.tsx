"use client";

import { memo } from "react";
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

/**
 * Persistent bottom navigation.
 *
 * Performance notes:
 * - Wrapped in memo to skip re-renders when unrelated ancestor state changes.
 * - Active indicator index is derived synchronously from `pathname`, eliminating the
 *   post-paint flash that a useEffect-based setState would cause.
 * - The pill indicator movement is handled entirely by CSS transform transition so it
 *   runs on the compositor thread without blocking the main thread.
 */
const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();
  const activeIndex = getActiveIndex(pathname);

  return (
    <nav aria-label="Navegación móvil" className="sc-mobile-nav-shell safe-bottom">
      <div
        className={`sc-mobile-tabbar ${activeIndex >= 0 ? `sc-mobile-tabbar-active-${activeIndex}` : ""}`}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              transitionTypes={["section-nav"]}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "sc-tab-selected" : ""}
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
});

export default BottomNav;
