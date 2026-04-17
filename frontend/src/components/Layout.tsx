import { useState } from "react";

import useIsMobile from "../hooks/useIsMobile";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";


export default function Layout({ title, children, showTopbar = true }) {
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
