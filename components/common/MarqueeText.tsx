/**
 * MarqueeText: muestra texto que se desplaza horizontalmente
 * solo si es más largo que su contenedor. Si cabe, se queda quieto.
 * Funciona 100% con CSS, sin JS.
 */
export default function MarqueeText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${className}`}
      style={{ maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 90%, transparent 100%)" }}
    >
      <span className="inline-block animate-marquee hover:[animation-play-state:paused]">
        {text}
        {/* Separador para que el loop sea natural */}
        <span className="px-8 text-[#c7c7cc]">·</span>
        {text}
        <span className="px-8 text-[#c7c7cc]">·</span>
      </span>
    </div>
  );
}
