# Sistema de Diseño Completo — StefyCloud (DESIGN.md)

Este documento contiene la guía completa del **Sistema de Diseño (Design System)** de StefyCloud. Incluye tokens de color, componentes clave (botones, navegación flotante, tarjetas, modales), estilos CSS/Tailwind y código React/JSX para reutilizar en cualquier proyecto web o PWA mobile-first.

---

## 1. Filosofía de Diseño y Estética

- **Estilo:** iOS Native / Apple Human Interface Guidelines + Glassmorphism sutil.
- **Paleta de Colores:** Fondos grises limpios (`#f5f5f7`), tarjetas blancas (`#ffffff` / `#fafafc`), acentos en Azul Apple (`#0071e3`) y tintes cromáticos semitransparentes.
- **Formas y Geometría:** Esquinas muy redondeadas (`14px`, `18px`, `20px`, cápsula `999px`), bordes sutiles de `1px solid rgba(60, 60, 67, 0.1)` y sombras profundas pero suaves.
- **Micro-interacciones:** Retroalimentación táctil activa (`active:scale-95`), aceleración por GPU (`transform: translateZ(0)`), y animaciones de entrada progresivas (`page-enter`).

---

## 2. Tokens de Diseño y Variables CSS Base

```css
:root {
  /* Color de Fondo App */
  --bg-app: #f5f5f7;
  --bg-card: #ffffff;
  --bg-card-secondary: #fafafc;
  
  /* Primary Action Color (Apple Blue) */
  --btn-primary: #0071e3;
  --btn-primary-hover: #0077ed;
  --btn-primary-active: #0062c4;
  
  /* Neutral / Glass Surface */
  --btn-glass-bg: #fafafc;
  --btn-glass-border: rgba(60, 60, 67, 0.10);
  --btn-shadow: 0 18px 42px rgba(31, 48, 72, 0.20), 0 6px 14px rgba(31, 48, 72, 0.10);
  
  /* Icon Tints (Action Grid & Badges) */
  --tint-blue: rgba(0, 136, 255, 0.13);
  --tint-blue-text: #0088ff;
  --tint-green: rgba(52, 199, 89, 0.14);
  --tint-green-text: #34c759;
  --tint-orange: rgba(255, 149, 0, 0.14);
  --tint-orange-text: #ff9500;
  --tint-red: rgba(255, 59, 48, 0.14);
  --tint-red-text: #ff3b30;

  /* Texto */
  --text-primary: #1c1c1e;
  --text-secondary: #6e6e73;
  --text-tertiary: #8e8e93;

  /* Bordes & Sombras */
  --border-subtle: 1px solid rgba(60, 60, 67, 0.10);
  --border-card: 1px solid rgba(229, 229, 234, 0.75);
  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.04);
  --shadow-floating: 0 18px 42px rgba(31, 48, 72, 0.20), 0 6px 14px rgba(31, 48, 72, 0.10);
}
```

---

## 3. Tipografía y Estructura de Encabezados

Se utiliza una tipografía sans-serif limpia (Inter / SF Pro Display) con pesos destacados en etiquetas.

```tsx
// Título de Sección
export function SectionTitle({ title }: { title: string }) {
  return (
    <h1 className="text-[1.65rem] font-bold tracking-tight text-[#1c1c1e] mb-3">
      {title}
    </h1>
  );
}

// Subtítulos / Subencabezados
<h2 className="text-base font-semibold text-[#1c1c1e]">Título de Card</h2>
<p className="text-xs font-medium text-[#6e6e73]">Descripción o fecha secundaria</p>
```

---

## 4. Componentes de Entrada & Búsqueda

Barra de búsqueda compacta con icono integrado, fondo gris claro y limpieza rápida.

```tsx
import { Search, X } from "lucide-react";

export function SearchBar({ value, onChange, placeholder = "Buscar..." }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93]" size={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-10 bg-[#e5e5ea]/60 text-[#1c1c1e] placeholder-[#8e8e93] text-sm font-medium rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8e8e93] hover:text-[#1c1c1e]"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
```

---

## 5. Tarjetas (Widgets) & Listas

Las listas y paneles principales usan un contenedor redondeado a `20px` con divisores finos.

```css
/* Contenedor Widget / Tarjeta Base */
.sc-widget {
  background: #ffffff;
  border: 1px solid rgba(60, 60, 67, 0.10);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 16px;
}

/* Fila de Lista (Ej: Documentos, Recordatorios, Notas) */
.sc-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f2f2f7;
  transition: background-color 160ms ease;
}

.sc-list-row:last-child {
  border-bottom: none;
}

.sc-list-row:active {
  background-color: #f2f2f7;
}
```

---

## 6. Sistema Completo de Botones

### 6.1 Botón Flotante (Floating Action Button / FAB)

Botón flotante circular con animación al presionar (`scale(0.95)`), elevación de sombra iOS y soporte para posición primaria/secundaria.

```tsx
"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";

interface FloatingButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  icon?: ReactNode;
  position?: "primary" | "secondary";
}

export default function FloatingButton({
  onClick,
  label = "Nuevo",
  disabled = false,
  icon,
  position = "primary",
}: FloatingButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`sc-floating-button sc-floating-button-${position} fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#0071e3] text-white shadow-lg transition-[background-color,box-shadow,transform,opacity] duration-200 hover:bg-[#0077ed] focus-visible:bg-[#0077ed] active:scale-95 disabled:opacity-50 disabled:active:scale-100`}
    >
      {icon ?? <Plus size={26} strokeWidth={2} />}
    </button>
  );

  if (!mounted) return null;
  return createPortal(button, document.body);
}
```

```css
.sc-floating-button {
  position: fixed;
  bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px) + 12px);
  right: max(1.25rem, calc((100vw - 500px) / 2 + 1.25rem));
  -webkit-transform: translateZ(0);
  transform: translateZ(0); /* Capa GPU para iOS */
}

.sc-floating-button-secondary {
  right: max(5.5rem, calc((100vw - 500px) / 2 + 5.5rem));
}
```

---

### 6.2 Botones de Modal / Acción Rápida (Grid 2×2)

Cuadrícula táctil ideal para hojas o diálogos emergentes ("Añadir", "Opciones"). Cada botón es una celda limpia con icono con fondo tintado.

```tsx
import { Camera, FileText, SquarePen, Bell, X } from "lucide-react";

export function ActionGridModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="sc-action-modal-backdrop" onClick={onClose}>
      <div className="sc-action-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sc-action-modal-head">
          <p id="sc-new-action-title">Añadir</p>
          <button className="sc-action-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="sc-action-modal-grid">
          <button className="sc-action-modal-cell" type="button">
            <span className="sc-action-modal-icon sc-icon-blue">
              <Camera size={22} />
            </span>
            <span>Tomar foto</span>
          </button>

          <button className="sc-action-modal-cell" type="button">
            <span className="sc-action-modal-icon sc-icon-green">
              <FileText size={22} />
            </span>
            <span>Subir PDF</span>
          </button>

          <button className="sc-action-modal-cell" type="button">
            <span className="sc-action-modal-icon sc-icon-orange">
              <SquarePen size={22} />
            </span>
            <span>Nueva nota</span>
          </button>

          <button className="sc-action-modal-cell" type="button">
            <span className="sc-action-modal-icon sc-icon-red">
              <Bell size={22} />
            </span>
            <span>Recordatorio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

```css
.sc-action-modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sc-action-modal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 96px;
  padding: 18px 14px 16px;
  color: #1a1a1a;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(229, 229, 234, 0.75);
  border-radius: 18px;
  font-size: 0.88rem;
  font-weight: 650;
  text-align: center;
  transition: background-color 160ms ease, transform 160ms ease;
}

.sc-action-modal-cell:hover,
.sc-action-modal-cell:focus-visible {
  background: rgba(255, 255, 255, 0.90);
}

.sc-action-modal-cell:active {
  transform: scale(0.95);
}

/* Icon Containers con Tintes de Color */
.sc-action-modal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
}

.sc-icon-red    { color: #ff3b30; background: rgba(255, 59, 48, 0.13); }
.sc-icon-green  { color: #34c759; background: rgba(52, 199, 89, 0.14); }
.sc-icon-orange { color: #ff9500; background: rgba(255, 149, 0, 0.14); }
.sc-icon-blue   { color: #0088ff; background: rgba(0, 136, 255, 0.13); }
```

---

### 6.3 Botón Circular Secundario / Icono Header

```tsx
<button
  type="button"
  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5e5ea]/70 text-[#1c1c1e] transition-all hover:bg-[#e5e5ea] active:scale-95 focus-visible:outline-none"
  aria-label="Cerrar"
>
  <X size={18} />
</button>
```

---

## 7. Bottom Navigation Bar (PWA / Mobile Shell)

El componente característico de navegación móvil fija con pestaña deslizante activa (`pill`).

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, File, FileText, Image, Search } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/notes", label: "Notas", icon: File },
  { href: "/documents", label: "Docs", icon: FileText },
  { href: "/images", label: "Imágenes", icon: Image },
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex(item => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <nav className="sc-mobile-nav-shell safe-bottom">
      <div className={`sc-mobile-tabbar ${activeIndex >= 0 ? `sc-mobile-tabbar-active-${activeIndex}` : ""}`}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={isActive ? "sc-tab-selected" : ""}>
              <Icon size={26} strokeWidth={2.2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Botón de Acción / Búsqueda Separado */}
      <Link href="/search" className="sc-mobile-search-button" aria-label="Buscar">
        <Search size={28} strokeWidth={2.2} />
      </Link>
    </nav>
  );
}
```

```css
.sc-mobile-nav-shell {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 16px calc(25px + env(safe-area-inset-bottom, 0px));
  pointer-events: none;
  transform: translateZ(0); /* Capa GPU */
}

.sc-mobile-tabbar {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: min(calc(100vw - 110px), 346px);
  height: 62px;
  padding: 5px;
  background: #fafafc;
  border: 1px solid rgba(60, 60, 67, 0.10);
  border-radius: 999px;
  box-shadow: 0 18px 42px rgba(31, 48, 72, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.90);
  pointer-events: auto;
}

/* Indicador deslizante (Pill) */
.sc-mobile-tabbar::before {
  content: "";
  position: absolute;
  inset: 4px auto 4px 4px;
  width: calc((100% - 8px) / 4);
  background: rgba(0, 136, 255, 0.14);
  border-radius: 999px;
  transform: translateX(-120%);
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.sc-mobile-tabbar-active-0::before { transform: translateX(0); }
.sc-mobile-tabbar-active-1::before { transform: translateX(100%); }
.sc-mobile-tabbar-active-2::before { transform: translateX(200%); }
.sc-mobile-tabbar-active-3::before { transform: translateX(300%); }

.sc-mobile-tabbar a {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  gap: 1px;
  color: #111;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 650;
  text-decoration: none;
}

.sc-mobile-tabbar a:active svg,
.sc-mobile-search-button:active svg {
  transform: scale(0.9);
}

.sc-mobile-search-button {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  background: #fafafc;
  border: 1px solid rgba(60, 60, 67, 0.10);
  border-radius: 999px;
  box-shadow: 0 18px 42px rgba(31, 48, 72, 0.20);
  pointer-events: auto;
}
```

---

## 8. Modales y Hojas Inferiores (Action Sheets)

```css
/* Backdrop Oscuro con Blur */
.sc-action-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  padding: 16px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
}

/* Modal Emergente */
.sc-action-modal {
  width: 100%;
  max-width: 400px;
  background: rgba(250, 250, 252, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.80);
  border-radius: 28px;
  padding: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.20);
  animation: sc-modal-slide-up 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes sc-modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

## 9. Animaciones de Navegación y Carga Progresiva

```css
/* Transición de entrada de página */
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-animate {
  animation: page-enter 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Skeleton Loading Soft Pulse */
.sc-loading-skeleton {
  background: linear-gradient(90deg, rgba(118, 118, 128, 0.08), rgba(118, 118, 128, 0.14), rgba(118, 118, 128, 0.08));
  background-size: 200% 100%;
  animation: sc-pulse 1100ms ease-in-out infinite;
  border-radius: 12px;
}

@keyframes sc-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 10. Checklist de Implementación en un Nuevo Proyecto

1. Instalar `lucide-react` para iconografía consistente.
2. Añadir las variables CSS base en `globals.css`.
3. Configurar viewport con `viewport-fit=cover` para soportar safe-areas en iOS (`env(safe-area-inset-bottom)`).
4. Usar `active:scale-95` en elementos interactivos para lograr la sensación nativa.
5. Aplicar `transform: translateZ(0)` a barras de navegación fijas para renderizado fluido en GPU.
