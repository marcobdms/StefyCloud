"use client";

import { useEffect, useRef, useState } from "react";

interface FavoriteToastEventDetail {
  message: string;
}

const TOAST_EXIT_MS = 360;

export default function FavoriteToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      timeoutRef.current = null;
      exitTimeoutRef.current = null;
    };

    const closeToast = () => {
      setLeaving(true);
      exitTimeoutRef.current = setTimeout(() => {
        setMessage(null);
        setLeaving(false);
        exitTimeoutRef.current = null;
      }, TOAST_EXIT_MS);
    };

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<FavoriteToastEventDetail>).detail;
      if (!detail?.message) return;

      clearTimers();
      setLeaving(false);
      setMessage(detail.message);
      timeoutRef.current = setTimeout(closeToast, 1800);
    };

    window.addEventListener("stefycloud:favorite-toast", handleToast);

    return () => {
      window.removeEventListener("stefycloud:favorite-toast", handleToast);
      clearTimers();
    };
  }, []);

  if (!message) return null;

  return (
    <div className={`sc-mini-toast${leaving ? " sc-mini-toast-leaving" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
