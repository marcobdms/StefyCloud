"use client";

import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function PushSetup() {
  usePushNotifications();
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <PushSetup />
      <Header />
      <main className="flex-1 max-w-[500px] mx-auto w-full px-4 pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
