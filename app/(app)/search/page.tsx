"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Search,
  StickyNote,
  X,
  type LucideIcon,
} from "lucide-react";
import SectionTitle from "@/components/common/SectionTitle";
import { useDocuments } from "@/hooks/useDocuments";
import { useImages } from "@/hooks/useImages";
import { useNotes } from "@/hooks/useNotes";
import { Suspense, useState } from "react";

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  className: string;
  external?: boolean;
};

type SearchGroup = {
  title: string;
  results: SearchResult[];
};

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesSearch(value: string, term: string) {
  return normalizeSearch(value).includes(term);
}

function getNoteExcerpt(content: string, term: string) {
  const trimmed = content.trim();
  if (!trimmed) return "Sin contenido";
  const matchingLine = trimmed
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && matchesSearch(line, term));

  return matchingLine ?? trimmed.split("\n")[0] ?? "Sin contenido";
}

function SearchResultRow({ result }: { result: SearchResult }) {
  const Icon = result.icon;
  const content = (
    <>
      <span className={`sc-search-result-icon ${result.className}`}>
        <Icon size={17} aria-hidden="true" />
      </span>
      <span className="sc-search-result-copy">
        <strong>{result.title}</strong>
        <small>{result.subtitle}</small>
      </span>
      <ChevronRight className="sc-chevron" size={16} aria-hidden="true" />
    </>
  );

  if (result.external) {
    return (
      <a className="sc-search-result-row" href={result.href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={result.href} transitionTypes={["section-nav"]} className="sc-search-result-row">
      {content}
    </Link>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") ?? "";
  const [searchState, setSearchState] = useState(() => ({
    source: queryFromUrl,
    value: queryFromUrl,
  }));
  const { notes, loaded: notesLoaded } = useNotes();
  const { documents, loaded: documentsLoaded } = useDocuments();
  const { images, loaded: imagesLoaded } = useImages();
  const search = searchState.source === queryFromUrl ? searchState.value : queryFromUrl;
  const term = normalizeSearch(search.trim());
  const isLoaded = notesLoaded && documentsLoaded && imagesLoaded;
  const updateSearch = (value: string) => setSearchState({ source: queryFromUrl, value });

  const groups: SearchGroup[] = term
    ? [
        {
          title: "Notas",
          results: notes
            .filter((note) => matchesSearch(note.title, term) || matchesSearch(note.content, term))
            .map((note) => ({
              id: note.id,
              title: note.title || "Sin título",
              subtitle: matchesSearch(note.title, term) ? "Título de nota" : getNoteExcerpt(note.content, term),
              href: `/notes/${note.id}`,
              icon: StickyNote,
              className: "sc-search-result-note",
            })),
        },
        {
          title: "Documentos",
          results: documents
            .filter((document) => matchesSearch(document.name, term))
            .map((document) => ({
              id: document.id,
              title: document.name,
              subtitle: "Nombre de documento",
              href: document.url || "/documents",
              icon: FileText,
              className: "sc-search-result-doc",
              external: Boolean(document.url),
            })),
        },
        {
          title: "Imágenes",
          results: images
            .filter((image) => matchesSearch(image.title, term))
            .map((image) => ({
              id: image.id,
              title: image.title || "Sin título",
              subtitle: "Título de imagen",
              href: `/images/${image.id}`,
              icon: ImageIcon,
              className: "sc-search-result-image",
            })),
        },
      ].filter((group) => group.results.length > 0)
    : [];

  const totalResults = groups.reduce((total, group) => total + group.results.length, 0);

  return (
    <div className="sc-search-page page-animate pt-2">
      <SectionTitle title="Buscar" />

      <label className="sc-global-search-field">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          placeholder="Buscar notas, docs o imágenes..."
          aria-label="Buscar por título, nombre o contenido"
          autoFocus
        />
        {search ? (
          <button type="button" onClick={() => updateSearch("")} aria-label="Borrar búsqueda">
            <X size={17} aria-hidden="true" />
          </button>
        ) : null}
      </label>

      <div className="sc-search-feedback" aria-live="polite">
        {!term ? "Busca por título, nombre de archivo o contenido de notas." : null}
        {term && !isLoaded ? "Cargando resultados..." : null}
        {term && isLoaded ? `${totalResults} resultado${totalResults === 1 ? "" : "s"}` : null}
      </div>

      {term && isLoaded && totalResults === 0 ? (
        <div className="sc-search-empty">
          <span>
            <Search size={28} aria-hidden="true" />
          </span>
          <strong>Sin resultados</strong>
          <p>No hay notas, documentos o imágenes que coincidan.</p>
        </div>
      ) : null}

      {groups.map((group) => (
        <section className="sc-search-group" key={group.title} aria-labelledby={`search-${group.title}`}>
          <h3 id={`search-${group.title}`}>{group.title}</h3>
          <div className="sc-search-result-list">
            {group.results.map((result) => (
              <SearchResultRow key={result.id} result={result} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
