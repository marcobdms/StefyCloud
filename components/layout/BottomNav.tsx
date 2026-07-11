"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, StickyNote, FileText, Image, Bell } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/notes", label: "Notas", icon: StickyNote },
  { href: "/documents", label: "Docs", icon: FileText },
  { href: "/images", label: "Imágenes", icon: Image },
  { href: "/reminders", label: "Recordar", icon: Bell },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-[#e5e5ea] safe-bottom">
      <div className="max-w-[500px] mx-auto flex items-center justify-around px-2 h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-all duration-200 ${
                isActive ? "text-[#0071e3]" : "text-[#6e6e73]"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
              />
              <span className={`text-[10px] font-medium transition-all ${isActive ? "font-semibold" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
