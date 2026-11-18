// ⚠️ ARCHIVO COMPARTIDO ENTRE LOS 9 GRUPOS ⚠️
//
// Este Header aparece en TODAS las páginas de la plataforma.
// NO lo modifiquen por su cuenta desde su módulo: el diseño final
// (logo, links de navegación, estilo) se define en conjunto entre
// los 9 grupos y cualquier cambio se hace vía Pull Request revisado
// por el equipo Platform.
//
// Por ahora este es un placeholder funcional para que puedan probar
// su propia página mientras se define el diseño final del header.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";
import SearchButton from "./boton_busqueda";
import Campana from "./campana";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/catalogo" },
    { label: "Entradas", href: "/entradas" },
    { label: "Organizador", href: "/organizador" },
    { label: "Promociones", href: "/promociones" },
    { label: "Check-in", href: "/checkin" },
    { label: "Pagos", href: "/pagos" },
    { label: "Mi cuenta", href: "/auth" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .header-container {
          position: sticky;
          top: 0;
          background-color: #2F4374;
          color: #FFFFFF;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .header-top {
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .logo-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          align-items: center;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .logo-link:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }
        .nav-menu {
          display: flex;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          align-items: center;
        }
        .nav-item {
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 999px;
          transition: all 0.2s ease;
          text-decoration: none;
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        .nav-item.active {
          background-color: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .right-controls {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .avatar-link {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
          border-radius: 999px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .avatar-link:hover {
          transform: scale(1.08);
        }
        .avatar-circle {
          width: 34px;
          height: 34px;
          background-color: #FFFFFF;
          color: #2F4374;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        @media (max-width: 1080px) {
          .mobile-scroll-container {
            width: 100%;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 8px 16px;
            background-color: #25365e;
            border-top: 1px solid rgba(255, 255, 255, 0.12);
          }
          .mobile-scroll-container::-webkit-scrollbar {
            display: none;
          }
          .desktop-nav {
            display: none;
          }
        }
        @media (min-width: 1081px) {
          .mobile-scroll-container {
            display: none;
          }
        }
      `}} />
      <header className="header-container">
        <div className="header-top">
          <div className="header-brand">
            <Link href="/" className="logo-link" title="TicketU - Inicio">
              <Logo />
            </Link>
            <nav className="nav-menu desktop-nav" aria-label="Navegación principal">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="right-controls">
            <SearchButton />
            <Campana />
            <Link href="/auth" className="avatar-link" title="Mi Cuenta / Autenticación">
              <div className="avatar-circle">MC</div>
            </Link>
          </div>
        </div>
        <div className="mobile-scroll-container">
          <nav className="nav-menu" aria-label="Navegación móvil">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}
