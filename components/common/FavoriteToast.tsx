"use client";

import { useEffect, useRef, useState } from "react";

interface FavoriteToastEventDetail {
  message: string;
}

export default function FavoriteToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<FavoriteToastEventDetail>).detail;
      if (!detail?.message) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(detail.message);
      timeoutRef.current = setTimeout(() => {
        setMessage(null);
        timeoutRef.current = null;
      }, 1800);
    };

    window.addEventListener("stefycloud:favorite-toast", handleToast);

    return () => {
      window.removeEventListener("stefycloud:favorite-toast", handleToast);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="sc-mini-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
