import { useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import useIsMobile from "@/hooks/useIsMobile";

export default function Layout({ title, children, showTopbar = false }) {
  const isMobile = useIsMobile();
  const [menuAberto, setMenuAberto] = useState(false);
  const mainClassName = showTopbar
    ? "app-shell__main"
    : "app-shell__main app-shell__main--compact";

  return (
    <div className="app-shell">
      <Sidebar
        aberto={menuAberto}
        isMobile={isMobile}
        onOpen={() => setMenuAberto(true)}
        onClose={() => setMenuAberto(false)}
      />

      <main className={mainClassName}>
        {showTopbar ? <Topbar title={title} /> : null}
        {children}
      </main>
    </div>
  );
}
