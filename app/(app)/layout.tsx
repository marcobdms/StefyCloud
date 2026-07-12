"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function PushSetup() {
  usePushNotifications();
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Fade out rápido → esperar render → fade in
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col overflow-x-hidden">
      <PushSetup />
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
