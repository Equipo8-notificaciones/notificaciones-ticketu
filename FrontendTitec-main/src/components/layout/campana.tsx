"use client";

import { useEffect, useRef, useState } from "react";
import NotificacionesPlaceholder from "@/modules/notificaciones/components/NotificacionesPlaceholder";

export default function Campana() {
  const [abierto, panel_abierto] = useState(false); // abierto = false (cerrado), panel_abierto = true (panel abierto)
  const contenedor = useRef<HTMLDivElement>(null);

   // se ejecuta este efecto cuando cambia el valor de "abierto"
  useEffect(() => {
    if (!abierto) return;
    
    // cerrar al hacer clic fuera del panel de notificaciones
    function cerrar_al_hacer_clic_fuera(evento: MouseEvent) {
      if (
        evento.target instanceof Node &&
        !contenedor.current?.contains(evento.target)
      ) {
        panel_abierto(false);
      }
    }
   
    // cerrar cuando se precione "Esc" en el teclado
    function cerrar_con_escape(evento: KeyboardEvent) {
      if (evento.key === "Escape") panel_abierto(false);
    }

    document.addEventListener("mousedown", cerrar_al_hacer_clic_fuera);
    document.addEventListener("keydown", cerrar_con_escape);
    return () => {
      document.removeEventListener("mousedown", cerrar_al_hacer_clic_fuera);
      document.removeEventListener("keydown", cerrar_con_escape);
    };
  }, [abierto]);

  // lo que se mostrara en la pantalla
  return (
    <div ref={contenedor}>
      <button
        type="button"
        aria-label={abierto ? "Cerrar notificaciones" : "Abrir notificaciones"}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        onClick={() => panel_abierto((actual) => !actual)} // cuando se presione la campana, cambia al estado contrario del actual
        style={{
          width: "44px",
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "inherit",
          background: "transparent",
          border: 0,
          padding: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "36px",
            height: "36px",
            backgroundColor: "#2F4374",
            borderRadius: "999px",
            border: "2px solid #FFFFFF",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <line x1="10" y1="21" x2="14" y2="21"></line>
          </svg>
        </span>
      </button>
      {/* Muestra el panel cuando "abierto" es true. Si "abierto" es false, el panel no se renderiza. */}
      {abierto && <NotificacionesPlaceholder />} 
    </div>
  );
}
