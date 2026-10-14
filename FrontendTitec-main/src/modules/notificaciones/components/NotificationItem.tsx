import type { Notificacion } from "../api";
import { notificaciones_design } from "./notificacionesDesign";
import { useRef } from "react";
import RecordatorioEvento from "./RecordatorioEvento";

type NotificationItemProps = {
  notificacion: Notificacion;
  modo_seleccion: boolean;
  seleccionada: boolean;
  al_abrir: () => void;
  al_mantener_presionada: () => void;
  al_alternar_seleccion: () => void;
};

export default function NotificationItem({
  notificacion,
  modo_seleccion,
  seleccionada,
  al_abrir,
  al_mantener_presionada,
  al_alternar_seleccion,
}: NotificationItemProps) {
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulsacion_larga = useRef(false);
  const fecha_emision = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(notificacion.fecha_emision));

  function iniciar_pulsacion_larga() {
    pulsacion_larga.current = false;
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      pulsacion_larga.current = true;
      al_mantener_presionada();
    }, 1000);
  }

  function limpiar_pulsacion_larga() {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  }

  return (
    <div className={`notificacion ${notificacion.estado === "no_leida" ? "no-leida" : ""} ${seleccionada ? "seleccionada" : ""}`}>
      {modo_seleccion && (
        <input
          className="selector"
          type="checkbox"
          checked={seleccionada}
          onChange={al_alternar_seleccion}
          aria-label={`Seleccionar ${notificacion.titulo}`}
        />
      )}
      <div
        className="contenido-notificacion"
        role="button"
        tabIndex={0}
        aria-pressed={modo_seleccion ? seleccionada : undefined}
        onPointerDown={iniciar_pulsacion_larga}
        onMouseDown={iniciar_pulsacion_larga}
        onTouchStart={iniciar_pulsacion_larga}
        onPointerUp={limpiar_pulsacion_larga}
        onMouseUp={limpiar_pulsacion_larga}
        onTouchEnd={limpiar_pulsacion_larga}
        onPointerLeave={limpiar_pulsacion_larga}
        onPointerCancel={limpiar_pulsacion_larga}
        onContextMenu={(event) => event.preventDefault()}
        onClick={() => {
          if (pulsacion_larga.current) {
            pulsacion_larga.current = false;
            return;
          }
          if (modo_seleccion) al_alternar_seleccion();
          else al_abrir();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (modo_seleccion) al_alternar_seleccion();
            else al_abrir();
          }
        }}
      >
      <div className="icono">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {notificacion.tipo === "COMPRA" ? (
            <path d="m5 12 4 4L19 6" />
          ) : notificacion.tipo === "RECORDATORIO" ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </>
          )}
        </svg>
      </div>
      <div className="contenido">
        <div className="titulo-fila">
          <h3>{notificacion.titulo}</h3>
          {notificacion.estado === "no_leida" && (
            <span className="punto-no-leida" aria-label="Sin leer" />
          )}
        </div>
        {notificacion.tipo === "RECORDATORIO" ? (
          <RecordatorioEvento notificacion={notificacion} />
        ) : (
          <>
            {typeof notificacion.datos.nombreEvento === "string" && (
              <p className="evento">{notificacion.datos.nombreEvento}</p>
            )}
            {typeof notificacion.datos.fechaEvento === "string" && (
              <p className="detalle">Evento: {notificacion.datos.fechaEvento}</p>
            )}
            {typeof notificacion.datos.cantidadEntradas === "number" && (
              <p className="detalle">
                {notificacion.datos.cantidadEntradas}{" "}
                {notificacion.datos.cantidadEntradas === 1 ? "entrada" : "entradas"}
              </p>
            )}
            {typeof notificacion.datos.nombreEvento !== "string" && (
              <p className="detalle">{notificacion.mensaje}</p>
            )}
            <p className="detalle">{fecha_emision}</p>
          </>
        )}
      </div>
      </div>
      <style jsx>{`
        .notificacion {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid ${notificaciones_design.color_banner};
          background: ${notificaciones_design.color_superficie};
        }

        .notificacion.seleccionada {
          background: ${notificaciones_design.color_banner};
        }

        .selector {
          flex: 0 0 16px;
          width: 16px;
          height: 16px;
          margin: 10px 0 0;
          accent-color: ${notificaciones_design.color_acento};
          cursor: pointer;
        }

        .contenido-notificacion {
          display: flex;
          flex: 1;
          min-width: 0;
          gap: 12px;
          cursor: pointer;
          outline-offset: 3px;
          touch-action: pan-y;
          user-select: none;
        }

        .contenido-notificacion:focus-visible {
          outline: 2px solid ${notificaciones_design.color_acento};
        }

        .notificacion.no-leida {
          background: ${notificaciones_design.color_banner};
        }

        .icono {
          display: flex;
          flex: 0 0 36px;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${notificaciones_design.color_exito_fondo};
          color: ${notificaciones_design.color_exito_texto};
        }

        .icono svg {
          width: 20px;
          height: 20px;
        }

        .notificacion.no-leida .icono {
          background: ${notificaciones_design.color_superficie};
          color: ${notificaciones_design.color_texto_primario};
        }

        .contenido {
          flex: 1;
          min-width: 0;
        }

        .notificacion.no-leida .contenido {
          font-weight: 600;
        }

        .titulo-fila {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .titulo-fila h3 {
          margin: 0;
          color: ${notificaciones_design.color_texto_primario};
          font-family: ${notificaciones_design.tipografia_titulos};
          font-size: 14px;
          font-weight: ${notificacion.estado === "no_leida" ? "700" : "600"};
        }

        .punto-no-leida {
          flex: 0 0 7px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${notificaciones_design.color_acento};
        }

        .evento {
          margin: 5px 0 0;
          color: ${notificaciones_design.color_texto_primario};
          font-size: 14px;
          font-weight: 600;
        }

        .detalle {
          margin: 3px 0 0;
          color: ${notificaciones_design.color_texto_secundario};
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}