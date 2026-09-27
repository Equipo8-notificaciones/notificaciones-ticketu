"use client";

import { useEffect, useState } from "react";
import { obtener_notificaciones, type Notificacion } from "../api";
import { notificaciones_design } from "./notificacionesDesign";
import NotificationButton from "./NotificationButton";
import NotificationPanel from "./NotificationPanel";

const usuarioId = process.env.NEXT_PUBLIC_NOTIFICACIONES_USUARIO_ID ?? "usuario-demo";

// Sprint 1 — Estructura inicial del módulo de Notificaciones asociado a HU3
// Sprint 2 — HU3: Ver centro de notificaciones
export default function NotificacionesPlaceholder() {
  const [atributo_abierto, establecer_abierto] = useState(false);
  const [atributo_notificaciones, establecer_notificaciones] = useState<Notificacion[]>([]);
  const [atributo_cargando, establecer_cargando] = useState(true);
  const [atributo_error, establecer_error] = useState(false);

  // Sprint 2 — HU3: Obtener el centro del usuario al cargar el módulo.
  useEffect(() => {
    const atributo_controlador = new AbortController();

    obtener_notificaciones(usuarioId, atributo_controlador.signal)
      .then((atributo_resultado) => {
        establecer_notificaciones(atributo_resultado);
        establecer_error(false);
      })
      .catch((atributo_error_carga: Error) => {
        if (atributo_error_carga.name !== "AbortError") {
          establecer_error(true);
        }
      })
      .finally(() => establecer_cargando(false));

    return () => atributo_controlador.abort();
  }, []);

  const cantidad_no_leidas = atributo_notificaciones.filter(
    (atributo_notificacion) => atributo_notificacion.estado === "NO_LEIDA"
  ).length;

  return (
    <div className="notificaciones-container">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@600;700&display=swap");
      `}</style>

      <NotificationButton
        cantidad_no_leidas={cantidad_no_leidas}
        atributo_abierto={atributo_abierto}
        atributo_al_clicar={() => establecer_abierto(!atributo_abierto)}
      />

      {atributo_abierto && (
        <NotificationPanel
          atributo_notificaciones={atributo_notificaciones}
          cantidad_no_leidas={cantidad_no_leidas}
          atributo_cargando={atributo_cargando}
          atributo_error={atributo_error}
        />
      )}

      <style jsx>{`
        .notificaciones-container {
          position: fixed;
          top: 78px;
          right: 24px;
          z-index: 1000;
          font-family: ${notificaciones_design.tipografia_interfaz};
        }

        @media (max-width: 640px) {
          .notificaciones-container {
            right: 16px;
          }
        }
      `}</style>
    </div>
  );
}