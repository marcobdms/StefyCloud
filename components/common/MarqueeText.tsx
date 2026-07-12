"use client";

import { useRef, useEffect, useState } from "react";

/**
 * MarqueeText — solo anima el scroll si el texto realmente desborda el contenedor.
 * Si cabe, se muestra estático. Usa un ref para medir el overflow.
 */
export default function MarqueeText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const check = () => {
      setShouldMarquee(textEl.scrollWidth > container.clientWidth + 2);
    };

    check();
    // Re-chequea si cambia el tamaño de ventana
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden relative ${className}`}>
      {shouldMarquee ? (
        // Cuando desborda: animación de scroll continuo
        <div
          className="animate-marquee whitespace-nowrap"
          style={{ display: "inline-block" }}
        >
          <span>{text}</span>
          {/* Separador y repetición para loop suave */}
          <span className="mx-10 text-[#c7c7cc] opacity-40">•</span>
          <span>{text}</span>
          <span className="mx-10 text-[#c7c7cc] opacity-40">•</span>
        </div>
      ) : (
        // Si cabe: texto normal sin animación
        <span ref={textRef} className="whitespace-nowrap">
          {text}
        </span>
      )}
    </div>
  );
}
