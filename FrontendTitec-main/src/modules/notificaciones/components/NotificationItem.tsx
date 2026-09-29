import type { Notificacion } from "../api";
import { notificaciones_design } from "./notificacionesDesign";
import RecordatorioEvento from "./RecordatorioEvento";

type NotificationItemProps = {
  notificacion: Notificacion;
};

export default function NotificationItem({ notificacion }: NotificationItemProps) {
  const fecha_emision = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(notificacion.fecha_emision));

  return (
    <div
      className={`notificacion ${notificacion.estado === "NO_LEIDA" ? "no-leida" : ""}`}
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

          {notificacion.estado === "NO_LEIDA" && (
            <span className="punto-no-leida"></span>
          )}
        </div>

        {notificacion.tipo === "RECORDATORIO" ? (
          // Sprint 4 — HU2: Recibir recordatorio del evento
          <RecordatorioEvento notificacion={notificacion} />
        ) : (
          // Sprint 3 — HU1: Recibir correo de compra
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

      <style jsx>{`
        .notificacion {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid ${notificaciones_design.color_banner};
          background: ${notificaciones_design.color_superficie};
        }

        .notificacion.no-leida {
          background: ${notificaciones_design.color_banner};
        }

        .icono {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 50%;
          background: ${notificaciones_design.color_exito_fondo};
          color: ${notificaciones_design.color_exito_texto};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
        }

        .icono svg {
          width: 20px;
          height: 20px;
        }

        .notificacion.no-leida .icono {
          background: ${notificaciones_design.color_banner};
          color: ${notificaciones_design.color_texto_primario};
        }

        .contenido {
          flex: 1;
          min-width: 0;
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
          font-weight: 600;
        }

        .punto-no-leida {
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