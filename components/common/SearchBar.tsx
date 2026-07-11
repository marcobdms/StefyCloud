"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Buscar..." }: SearchBarProps) {
  return (
    <div className="relative flex items-center">
      <Search size={16} className="absolute left-3 text-[#6e6e73] pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white rounded-xl pl-9 pr-9 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#6e6e73] border border-[#e5e5ea] outline-none focus:border-[#0071e3] transition-colors duration-200"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
