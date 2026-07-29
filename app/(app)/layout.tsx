"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Fade out rápido → esperar render → fade in
    const hideTimer = setTimeout(() => setVisible(false), 0);
    const showTimer = setTimeout(() => setVisible(true), 60);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col overflow-x-hidden">
      <Header />
      <main
        className="flex-1 max-w-[500px] mx-auto w-full px-4 pb-28 transition-opacity duration-200 ease-out"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
