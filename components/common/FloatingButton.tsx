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
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
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
