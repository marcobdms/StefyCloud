"use client";

import { Plus } from "lucide-react";

interface FloatingButtonProps {
  onClick: () => void;
  label?: string;
}

export default function FloatingButton({ onClick, label = "Nuevo" }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed z-50 w-14 h-14 bg-[#0071e3] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-[#0077ed] active:scale-95"
      style={{
        bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px) + 12px)",
        right: "1.25rem",
      }}
    >
      <Plus size={26} strokeWidth={2} />
    </button>
  );
}
