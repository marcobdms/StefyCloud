"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronsUpDown,
  Cloud,
  Files,
  Home,
  Image,
  LogOut,
  NotebookPen,
  PanelLeftClose,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { clearAuthCookie, getAuthHeaders } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { useDocuments } from "@/hooks/useDocuments";
import { useImages } from "@/hooks/useImages";
import { useNotes } from "@/hooks/useNotes";
import { useReminders } from "@/hooks/useReminders";

const primaryItems = [
  { href: "/dashboard", label: "Inicio", icon: Home, count: null },
  { href: "/notes", label: "Notas", icon: NotebookPen, count: "notes" },
  { href: "/documents", label: "Documentos", icon: Files, count: "documents" },
  { href: "/images", label: "Imágenes", icon: Image, count: "images" },
  { href: "/reminders", label: "Recordatorios", icon: Bell, count: "reminders" },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { notes } = useNotes();
  const { documents } = useDocuments();
  const { images } = useImages();
  const { reminders } = useReminders();

  const counts = {
    notes: notes.length,
    documents: documents.length,
    images: images.length,
    reminders: reminders.filter((reminder) => !reminder.completed).length,
  };

  const handleLogout = () => {
    fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    }).catch(() => {});
    clearAuthCookie();
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };

  return (
    <aside className="sc-sidebar app-sidebar-anchor" aria-label="Barra lateral">
      <div className="sc-brandbar">
        <Link href="/dashboard" className="sc-brand" transitionTypes={["section-nav"]}>
          <span className="sc-brandmark">
            <Cloud size={16} aria-hidden="true" />
          </span>
          <span>StefyCloud</span>
        </Link>
        <button className="sc-symbol-button" type="button" aria-label="Contraer barra lateral">
          <PanelLeftClose size={16} aria-hidden="true" />
        </button>
      </div>

      <form className="sc-search" role="search" onSubmit={handleSearchSubmit}>
        <button className="sc-search-submit" type="submit" aria-label="Buscar">
          <Search size={17} aria-hidden="true" />
        </button>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar"
          aria-label="Buscar en StefyCloud"
        />
      </form>

      <nav aria-label="Principal">
        {primaryItems.map(({ href, label, icon: Icon, count }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              transitionTypes={["section-nav"]}
              aria-current={active ? "page" : undefined}
              className={`sc-side-row ${active ? "sc-side-row-selected" : ""}`}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
              {count ? <span className="sc-side-count">{counts[count]}</span> : null}
            </Link>
          );
        })}
      </nav>

      <section className="sc-sidebar-section" aria-label="Biblioteca">
        <div className="sc-section-label">Biblioteca</div>
        <Link
          href="/favorites"
          transitionTypes={["section-nav"]}
          aria-current={isActivePath(pathname, "/favorites") ? "page" : undefined}
          className={`sc-side-row ${isActivePath(pathname, "/favorites") ? "sc-side-row-selected" : ""}`}
        >
          <Star size={17} aria-hidden="true" />
          <span>Favoritos</span>
        </Link>
        <Link
          href="/trash"
          transitionTypes={["section-nav"]}
          aria-current={isActivePath(pathname, "/trash") ? "page" : undefined}
          className={`sc-side-row ${isActivePath(pathname, "/trash") ? "sc-side-row-selected" : ""}`}
        >
          <Trash2 size={17} aria-hidden="true" />
          <span>Papelera</span>
        </Link>
      </section>

      <div className="sc-sidebar-bottom">
        <div className="sc-profile-row">
          <span className="sc-avatar">S</span>
          <span className="sc-profile-copy">
            <strong>Stefany</strong>
            <small>Plan personal</small>
          </span>
          <ChevronsUpDown size={16} aria-hidden="true" />
          <button
            className="sc-profile-logout"
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
