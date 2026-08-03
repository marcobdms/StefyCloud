import { ViewTransition } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sc-app-frame">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <div className="sc-window" aria-label="StefyCloud">
        <div className="sc-ambient sc-ambient-one" />
        <div className="sc-ambient sc-ambient-two" />
        <Sidebar />
        <section className="sc-main">
          <Header />
          <main id="main-content" className="sc-route-content">
            <ViewTransition default="page-transition">{children}</ViewTransition>
          </main>
        </section>
        <BottomNav />
      </div>
    </div>
  );
}
