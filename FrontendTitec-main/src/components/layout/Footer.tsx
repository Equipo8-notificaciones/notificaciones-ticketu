// ⚠️ ARCHIVO COMPARTIDO ENTRE LOS 9 GRUPOS ⚠️
//
// Igual que el Header: aparece en TODAS las páginas. Se define en
// conjunto entre los 9 grupos y se modifica solo vía Pull Request.
//
// Placeholder funcional mientras se define el diseño final.

"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [modalType, setModalType] = useState<"ayuda" | "terminos" | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .footer-root {
          background-color: #24355a;
          color: #FFFFFF;
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .footer-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 2rem 2rem 2rem;
          display: grid;
          grid-template-columns: 1.4fr repeat(3, 1fr);
          gap: 2.5rem;
        }
        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .footer-logo-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 1.5px;
          transition: opacity 0.2s;
        }
        .footer-logo-link:hover {
          opacity: 0.85;
        }
        .footer-desc {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13.5px;
          line-height: 1.6;
          margin: 0;
        }
        .footer-column-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 1rem;
          color: #A9BCE2;
        }
        .footer-links-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .footer-btn-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: all 0.2s ease;
          width: fit-content;
        }
        .footer-btn-link:hover {
          color: #FFFFFF;
          background-color: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateX(4px);
        }
        .footer-btn-link svg {
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .footer-btn-link:hover svg {
          opacity: 1;
        }
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background-color: #1c2b4a;
          padding: 1.25rem 2rem;
        }
        .footer-bottom-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.65);
        }
        .footer-bottom-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .scroll-top-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: background-color 0.2s ease;
        }
        .scroll-top-btn:hover {
          background-color: rgba(255, 255, 255, 0.22);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.65);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          padding: 16px;
          backdrop-filter: blur(4px);
        }
        .modal-card {
          background-color: #FFFFFF;
          color: #1F2937;
          border-radius: 12px;
          max-width: 520px;
          width: 100%;
          padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 85vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 12px;
        }
        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6B7280;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .modal-close-btn:hover {
          background-color: #F3F4F6;
          color: #111827;
        }
        .modal-body {
          font-size: 14px;
          line-height: 1.6;
          color: #4B5563;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid #E5E7EB;
          padding-top: 12px;
        }
        .modal-confirm-btn {
          background-color: #2F4374;
          color: #FFFFFF;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .modal-confirm-btn:hover {
          background-color: #233257;
        }
        @media (max-width: 900px) {
          .footer-main {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 600px) {
          .footer-main {
            grid-template-columns: 1fr;
          }
          .footer-bottom-inner {
            flex-direction: column;
            text-align: center;
          }
        }
      `}} />

      <footer className="footer-root">
        <div className="footer-main">
          {/* Columna Marca */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo-link" title="TicketU - Ir al inicio">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path 
                  d="M3 12C4.65685 12 6 10.6569 6 9C6 7.89543 6.89543 7 8 7H24C25.1046 7 26 7.89543 26 9C26 10.6569 27.3431 12 29 12C29.5523 12 30 12.4477 30 13V19C30 19.5523 29.5523 20 29 20C27.3431 20 26 21.3431 26 23C26 24.1046 25.1046 25 24 25H8C6.89543 25 6 24.1046 6 23C6 21.3431 4.65685 20 3 20C2.44772 20 2 19.5523 2 19V13C2 12.4477 2.44772 12 3 12Z" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="rgba(255, 255, 255, 0.12)"
                />
                <line 
                  x1="18" 
                  y1="8" 
                  x2="18" 
                  y2="24" 
                  stroke="white" 
                  strokeWidth="1.8" 
                  strokeLinecap="round" 
                  strokeDasharray="2.5 3"
                />
                <circle cx="11" cy="16" r="2.2" stroke="white" strokeWidth="1.5" />
              </svg>
              <span>TICKET-U</span>
            </Link>
            <p className="footer-desc">
              Plataforma universitaria distribuida para la gestión integral de eventos: catálogo, reserva de entradas, pagos seguros, promociones y validación de accesos en tiempo real.
            </p>
            <div style={{ marginTop: "0.5rem" }}>
              <Link href="/" className="footer-btn-link" title="Ir a la página principal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Página de Inicio
              </Link>
            </div>
          </div>

          {/* Columna Explorar y Compra */}
          <div>
            <div className="footer-column-title">Explorar & Entradas</div>
            <ul className="footer-links-list">
              <li>
                <Link href="/catalogo" className="footer-btn-link" title="Ver catálogo de eventos">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Catálogo de Eventos
                </Link>
              </li>
              <li>
                <Link href="/entradas" className="footer-btn-link" title="Comprar y gestionar entradas">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                    <path d="M13 5v2"></path>
                    <path d="M13 17v2"></path>
                    <path d="M13 11v2"></path>
                  </svg>
                  Comprar Entradas
                </Link>
              </li>
              <li>
                <Link href="/promociones" className="footer-btn-link" title="Ver códigos de descuento">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="5" x2="5" y2="19"></line>
                    <circle cx="6.5" cy="6.5" r="2.5"></circle>
                    <circle cx="17.5" cy="17.5" r="2.5"></circle>
                  </svg>
                  Promociones y Descuentos
                </Link>
              </li>
              <li>
                <Link href="/entradas/confirmacion" className="footer-btn-link" title="Confirmación de reserva">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Confirmación de Compra
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Gestión & Operaciones */}
          <div>
            <div className="footer-column-title">Gestión & Operaciones</div>
            <ul className="footer-links-list">
              <li>
                <Link href="/organizador" className="footer-btn-link" title="Panel para organizadores de eventos">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  Panel de Organizador
                </Link>
              </li>
              <li>
                <Link href="/checkin" className="footer-btn-link" title="Validación de entradas en puerta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Control de Acceso (Check-in)
                </Link>
              </li>
              <li>
                <Link href="/pagos" className="footer-btn-link" title="Módulo de pagos">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  Pasarela de Pagos
                </Link>
              </li>
              <li>
                <Link href="/notificaciones" className="footer-btn-link" title="Historial de notificaciones">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <line x1="10" y1="21" x2="14" y2="21"></line>
                  </svg>
                  Centro de Notificaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Cuenta y Ayuda */}
          <div>
            <div className="footer-column-title">Mi Cuenta & Soporte</div>
            <ul className="footer-links-list">
              <li>
                <Link href="/auth" className="footer-btn-link" title="Iniciar sesión o registrarse">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Mi Cuenta / Autenticación
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalType("ayuda")}
                  className="footer-btn-link"
                  style={{ border: "1px dashed rgba(255, 255, 255, 0.3)" }}
                  title="Abrir centro de ayuda"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Centro de Ayuda
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalType("terminos")}
                  className="footer-btn-link"
                  style={{ border: "1px dashed rgba(255, 255, 255, 0.3)" }}
                  title="Consultar términos y condiciones de servicio"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  Términos de Servicio
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <div>
              <strong>TICKET-U © 2026</strong> — Plataforma de Gestión de Eventos & Entradas
            </div>
            <div className="footer-bottom-actions">
              <button
                type="button"
                onClick={scrollToTop}
                className="scroll-top-btn"
                title="Volver al principio de la página"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                Subir arriba
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal interactivo de Centro de Ayuda */}
      {modalType === "ayuda" && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Centro de Ayuda — TicketU</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalType(null)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>¿Cómo funciona la plataforma?</strong><br />
                TicketU te permite explorar eventos disponibles, comprar tus entradas, aplicar cupones promocionales y acceder al evento mediante validación QR (Check-in).
              </p>
              <p>
                <strong>Navegación rápida de módulos:</strong><br />
                • <strong>Catálogo:</strong> Explora fechas, horarios y ubicaciones.<br />
                • <strong>Entradas y Pagos:</strong> Selecciona tus asientos y efectúa el pago con Stripe en modo prueba.<br />
                • <strong>Organizador:</strong> Si eres productor, crea y administra tus eventos.<br />
                • <strong>Check-in:</strong> Controla el ingreso de asistentes en la entrada del evento.
              </p>
              <p>
                <strong>Contacto de soporte:</strong> soporte@ticketu.cl
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-confirm-btn"
                onClick={() => setModalType(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal interactivo de Términos de Servicio */}
      {modalType === "terminos" && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Términos de Servicio — TicketU</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalType(null)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>1. Propósito de la Plataforma</strong><br />
                TicketU es un prototipo y plataforma académica de microservicios desarrollada para la gestión distribuida de eventos y tickets.
              </p>
              <p>
                <strong>2. Transacciones y Pagos</strong><br />
                Los pagos operan a través del API Gateway conectado a Stripe en entorno de prueba (`pk_test_...`). No se efectúan cobros monetarios reales.
              </p>
              <p>
                <strong>3. Privacidad y Seguridad</strong><br />
                Las credenciales y tokens JWT se gestionan a través del microservicio de autenticación de forma cifrada y segura.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-confirm-btn"
                onClick={() => setModalType(null)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
