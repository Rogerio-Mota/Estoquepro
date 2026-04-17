import type { SVGProps } from "react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useSystemConfig from "../hooks/useSystemConfig";
import { getBrandInitials } from "../utils/branding";


type IconName =
  | "dashboard"
  | "orders"
  | "products"
  | "stock"
  | "movement"
  | "invoice"
  | "suppliers"
  | "users"
  | "reports"
  | "settings"
  | "more"
  | "chevron";

type MenuItem = {
  to: string;
  label: string;
  icon: IconName;
  matchPaths: string[];
};

type SidebarProps = {
  aberto: boolean;
  isMobile: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const MAIN_MENU_ITEMS: MenuItem[] = [
  { to: "/", label: "Painel", icon: "dashboard", matchPaths: ["/"] },
  { to: "/pedidos", label: "Pedidos", icon: "orders", matchPaths: ["/pedidos", "/novo-pedido", "/editar-pedido"] },
  { to: "/produtos", label: "Produtos", icon: "products", matchPaths: ["/produtos", "/novo-produto", "/editar-produto"] },
  { to: "/estoque-baixo", label: "Estoque", icon: "stock", matchPaths: ["/estoque-baixo"] },
  { to: "/movimentacoes", label: "Movimentos", icon: "movement", matchPaths: ["/movimentacoes", "/nova-movimentacao"] },
];

const SECONDARY_MENU_ITEMS: MenuItem[] = [
  { to: "/importar-nota-fiscal", label: "Importar NF-e", icon: "invoice", matchPaths: ["/importar-nota-fiscal"] },
  { to: "/relatorios", label: "Relatórios", icon: "reports", matchPaths: ["/relatorios"] },
  { to: "/fornecedores", label: "Fornecedores", icon: "suppliers", matchPaths: ["/fornecedores", "/novo-fornecedor", "/editar-fornecedor"] },
];


function getRoleLabel(tipo?: string | null) {
  if (tipo === "admin") {
    return "Administrador";
  }

  if (tipo === "funcionario") {
    return "Funcionário";
  }

  return "Usuário";
}


function isItemActive(pathname: string, item: MenuItem) {
  return item.matchPaths.some((matchPath) => (
    pathname === matchPath || pathname.startsWith(`${matchPath}/`)
  ));
}


function MenuIcon({
  name,
  className = "site-nav__icon",
}: {
  name: IconName;
  className?: string;
}) {
  const props: SVGProps<SVGSVGElement> = {
    "aria-hidden": "true",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "1.85",
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <path d="M4.5 5.5h6.5v6.5H4.5z" />
          <path d="M13 5.5h6.5v4.5H13z" />
          <path d="M13 12h6.5v6.5H13z" />
          <path d="M4.5 14h6.5v4.5H4.5z" />
        </svg>
      );
    case "orders":
      return (
        <svg {...props}>
          <path d="M7 5.5h10" />
          <path d="M7 10.5h10" />
          <path d="M7 15.5h6" />
          <path d="M4.5 5.5h.01" />
          <path d="M4.5 10.5h.01" />
          <path d="M4.5 15.5h.01" />
        </svg>
      );
    case "products":
      return (
        <svg {...props}>
          <path d="M12 3.8 19 7.5 12 11.2 5 7.5 12 3.8Z" />
          <path d="M5 7.5v8L12 19.2l7-3.7v-8" />
          <path d="M12 11.2v8" />
        </svg>
      );
    case "stock":
      return (
        <svg {...props}>
          <path d="M5 8.5h14" />
          <path d="M5 12h14" />
          <path d="M5 15.5h14" />
          <path d="M7 5.5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "movement":
      return (
        <svg {...props}>
          <path d="M4.5 8.5h11" />
          <path d="m12.5 5.5 3 3-3 3" />
          <path d="M19.5 15.5h-11" />
          <path d="m11.5 12.5-3 3 3 3" />
        </svg>
      );
    case "invoice":
      return (
        <svg {...props}>
          <path d="M8 4.5h6l4 4v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" />
          <path d="M14 4.5v4h4" />
          <path d="M8.5 12h7" />
          <path d="M8.5 15.5h7" />
        </svg>
      );
    case "suppliers":
      return (
        <svg {...props}>
          <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M5.5 18.5a6.5 6.5 0 0 1 13 0" />
          <path d="M18.5 8.5h1.5" />
          <path d="M4 8.5h1.5" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M9 11a2.8 2.8 0 1 0 0-5.6A2.8 2.8 0 0 0 9 11Z" />
          <path d="M4.8 18.5a4.6 4.6 0 0 1 8.4 0" />
          <path d="M16.8 10.2a2.2 2.2 0 1 0 0-4.4" />
          <path d="M15 18a4 4 0 0 1 4-3.4" />
        </svg>
      );
    case "reports":
      return (
        <svg {...props}>
          <path d="M5.5 18.5V9.5" />
          <path d="M12 18.5V5.5" />
          <path d="M18.5 18.5v-6" />
          <path d="M4 18.5h16" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
          <path d="M19 12a7.5 7.5 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7.8 7.8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.8 7.8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </svg>
      );
    case "more":
      return (
        <svg {...props}>
          <path d="M5 12h.01" />
          <path d="M12 12h.01" />
          <path d="M19 12h.01" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...props}>
          <path d="m7 10 5 5 5-5" />
        </svg>
      );
    default:
      return null;
  }
}


export default function Sidebar({
  aberto,
  isMobile,
  onOpen,
  onClose,
}: SidebarProps) {
  const { logout, user } = useAuth();
  const { config } = useSystemConfig();
  const location = useLocation();
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const secondaryMenuItems: MenuItem[] = user?.tipo === "admin"
    ? [
        ...SECONDARY_MENU_ITEMS,
        { to: "/usuarios", label: "Usuários", icon: "users", matchPaths: ["/usuarios", "/novo-usuario", "/editar-usuario"] },
        { to: "/configuracoes", label: "Configurações", icon: "settings", matchPaths: ["/configuracoes"] },
      ]
    : SECONDARY_MENU_ITEMS;
  const brandInitials = getBrandInitials(config.nome_empresa);
  const hasLogoImage = Boolean(config.logo_url);
  const showMobilePanel = isMobile && aberto;
  const hasSecondaryActive = secondaryMenuItems.some((item) => isItemActive(location.pathname, item));
  const highlightMoreToggle = hasSecondaryActive || moreMenuOpen;

  useEffect(() => {
    if (!moreMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !moreMenuRef.current?.contains(event.target)) {
        setMoreMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [moreMenuOpen]);

  return (
    <>
      {showMobilePanel ? (
        <button
          type="button"
          className="sidebar__overlay"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      ) : null}

      <header className="site-header">
        <div className="page-card site-header__bar">
          <div className="site-header__top">
            <NavLink
              to="/"
              className={`site-brand ${hasLogoImage ? "site-brand--with-image" : ""}`}
              onClick={isMobile ? onClose : () => setMoreMenuOpen(false)}
            >
              <div
                className={`site-brand__mark ${
                  hasLogoImage
                    ? "site-brand__mark--image"
                    : "site-brand__mark--fallback"
                }`}
              >
                {hasLogoImage ? (
                  <img
                    src={config.logo_url}
                    alt={`Logo de ${config.nome_empresa}`}
                    className="site-brand__logo-image"
                  />
                ) : (
                  <span>{brandInitials}</span>
                )}
              </div>
              <div className="site-brand__text">
                <strong className="site-brand__title">{config.nome_empresa}</strong>
                <span className="site-brand__subtitle">{config.descricao_empresa}</span>
              </div>
            </NavLink>

            {isMobile ? (
              <button
                type="button"
                className="site-header__menu-button"
                onClick={aberto ? onClose : onOpen}
                aria-expanded={aberto}
                aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              >
                {aberto ? "Fechar" : "Menu"}
              </button>
            ) : (
              <div className="site-header__actions">
                <div className="site-user">
                  <span className="site-user__name">{user?.username || "Usuário"}</span>
                  <span className="site-user__role">{getRoleLabel(user?.tipo)}</span>
                </div>

                <button type="button" className="button-secondary" onClick={logout}>
                  Sair
                </button>
              </div>
            )}
          </div>

          <div
            className={`site-header__panel ${
              isMobile ? "site-header__panel--mobile" : ""
            } ${showMobilePanel || !isMobile ? "site-header__panel--open" : ""}`}
          >
            {isMobile ? (
              <nav className="site-nav site-nav--mobile">
                {MAIN_MENU_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={() =>
                      `site-nav__link ${isItemActive(location.pathname, item) ? "site-nav__link--active" : ""}`
                    }
                    onClick={onClose}
                  >
                    <MenuIcon name={item.icon} />
                    <span className="site-nav__label">{item.label}</span>
                  </NavLink>
                ))}

                <span className="site-nav__section-label">Mais</span>

                {secondaryMenuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={() =>
                      `site-nav__link ${isItemActive(location.pathname, item) ? "site-nav__link--active" : ""}`
                    }
                    onClick={onClose}
                  >
                    <MenuIcon name={item.icon} />
                    <span className="site-nav__label">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            ) : (
              <nav className="site-nav site-nav--desktop">
                <div className="site-nav__desktop-scroll">
                  <div className="site-nav__desktop">
                    {MAIN_MENU_ITEMS.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={() =>
                          `site-nav__link ${isItemActive(location.pathname, item) ? "site-nav__link--active" : ""}`
                        }
                        onClick={() => setMoreMenuOpen(false)}
                      >
                        <MenuIcon name={item.icon} />
                        <span className="site-nav__label">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>

                <div className="site-nav__more" ref={moreMenuRef}>
                  <button
                    type="button"
                    className={`site-nav__more-toggle ${highlightMoreToggle ? "site-nav__more-toggle--active" : ""}`}
                    onClick={() => setMoreMenuOpen((current) => !current)}
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Abrir mais opções do menu"
                  >
                    <MenuIcon name="more" />
                    <span className="site-nav__label">Mais</span>
                    <MenuIcon name="chevron" className="site-nav__icon site-nav__icon--chevron" />
                  </button>

                  {moreMenuOpen ? (
                    <div className="site-nav__more-menu page-card" role="menu">
                      {secondaryMenuItems.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={() =>
                            `site-nav__more-link ${isItemActive(location.pathname, item) ? "site-nav__more-link--active" : ""}`
                          }
                          onClick={() => setMoreMenuOpen(false)}
                          role="menuitem"
                        >
                          <MenuIcon name={item.icon} />
                          <span className="site-nav__label">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              </nav>
            )}

            {isMobile ? (
              <div className="site-header__actions">
                <div className="site-user">
                  <span className="site-user__name">{user?.username || "Usuário"}</span>
                  <span className="site-user__role">{getRoleLabel(user?.tipo)}</span>
                </div>

                <button type="button" className="button-secondary" onClick={logout}>
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
