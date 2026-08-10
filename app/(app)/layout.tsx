import { ViewTransition } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import FavoriteToast from "@/components/common/FavoriteToast";

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
            <ViewTransition
              enter={{
                "section-nav": "section-nav",
                "nav-forward": "nav-forward",
                "nav-back": "nav-back",
                default: "none",
              }}
              exit={{
                "section-nav": "section-nav",
                "nav-forward": "nav-forward",
                "nav-back": "nav-back",
                default: "none",
              }}
              default="none"
            >
              {children}
            </ViewTransition>
          </main>
        </section>
        <BottomNav />
        <FavoriteToast />
      </div>
    </div>
  );
}
