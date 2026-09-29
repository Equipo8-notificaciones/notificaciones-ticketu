import type { Notificacion } from "../api";
import { notificaciones_design } from "./notificacionesDesign";

type RecordatorioEventoProps = {
  notificacion: Notificacion;
};

export default function RecordatorioEvento({
  notificacion,
}: RecordatorioEventoProps) {
  const fecha_emision = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(notificacion.fecha_emision));

  return (
    // Sprint 4 — HU2: Recibir recordatorio del evento
    <div className="notificacion-contenido">
      <div className="notificacion-texto">
        {typeof notificacion.datos.nombreEvento === "string" && (
          <p className="notificacion-detalle">
            {notificacion.datos.nombreEvento}
          </p>
        )}
        {typeof notificacion.datos.fechaEvento === "string" && (
          <p className="notificacion-detalle">
            Fecha del evento: {notificacion.datos.fechaEvento}
          </p>
        )}
        {typeof notificacion.datos.horaEvento === "string" && (
          <p className="notificacion-detalle">
            Hora: {notificacion.datos.horaEvento}
          </p>
        )}
        {typeof notificacion.datos.ubicacion === "string" && (
          <p className="notificacion-detalle">
            Lugar: {notificacion.datos.ubicacion}
          </p>
        )}
        {typeof notificacion.datos.enlaceEvento === "string" && (
          <a className="notificacion-enlace" href={notificacion.datos.enlaceEvento}>
            Ver evento
          </a>
        )}
        {!notificacion.datos.nombreEvento && (
          <p className="notificacion-detalle">{notificacion.mensaje}</p>
        )}
        <p className="notificacion-fecha">{fecha_emision}</p>
      </div>

      <style jsx>{`
        .notificacion-contenido {
          min-width: 0;
          font-family: ${notificaciones_design.tipografia_interfaz};
        }

        .notificacion-texto {
          min-width: 0;
        }

        .notificacion-detalle {
          margin: 4px 0 0;
          color: ${notificaciones_design.color_texto_secundario};
          font-size: 14px;
          line-height: 1.5;
        }

        .notificacion-fecha {
          margin: 8px 0 0;
          color: ${notificaciones_design.color_texto_secundario};
          font-size: 12px;
        }

        .notificacion-enlace {
          display: inline-block;
          min-height: 44px;
          padding: 12px 0;
          color: ${notificaciones_design.color_acento};
          font-size: 14px;
          font-weight: 600;
          text-decoration: underline;
        }

        .notificacion-enlace:focus-visible {
          outline: 2px solid ${notificaciones_design.color_acento};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}