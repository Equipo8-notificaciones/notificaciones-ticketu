import NotificationItem from "./NotificationItem";
import { notificaciones_design } from "./notificacionesDesign";
import type { Notificacion } from "../api";

type NotificationPanelProps = {
  atributo_notificaciones: Notificacion[];
  cantidad_no_leidas: number;
  atributo_cargando: boolean;
  atributo_error: boolean;
};

export default function NotificationPanel({
  atributo_notificaciones,
  cantidad_no_leidas,
  atributo_cargando,
  atributo_error,
}: NotificationPanelProps) {
  return (
    // Sprint 2 — HU3: Notificaciones cargadas, error, estado vacío y notificaciones ordenadas.
    <div className="panel-notificaciones">
      <div className="encabezado">
        <div>
          <h2>Notificaciones</h2>

          <p>
            {cantidad_no_leidas}{" "}
            {cantidad_no_leidas === 1
              ? "notificación sin leer"
              : "notificaciones sin leer"}
          </p>
        </div>
      </div>

      <div className="lista-notificaciones">
        {atributo_cargando && <p className="estado">Cargando notificaciones...</p>}
        {atributo_error && (
          <p className="estado estado-error">Error en mostrar notificaciones</p>
        )}
        {!atributo_cargando && !atributo_error && atributo_notificaciones.length === 0 && (
          <p className="estado">No tienes notificaciones nuevas.</p>
        )}
        {!atributo_cargando && !atributo_error && atributo_notificaciones.map((atributo_notificacion) => (
          <NotificationItem
            key={atributo_notificacion.id_notificacion}
            notificacion={atributo_notificacion}
          />
        ))}
      </div>

      <style jsx>{`
        .panel-notificaciones {
          position: absolute;
          top: 52px;
          right: 0;
          width: 390px;
          max-height: 520px;
          background: ${notificaciones_design.color_superficie};
          border: 1px solid ${notificaciones_design.color_borde};
          border-radius: ${notificaciones_design.radio_tarjeta};
          box-shadow: ${notificaciones_design.sombra_tarjeta};
          overflow: hidden;
        }

        .encabezado {
          padding: 20px 20px 16px;
          border-bottom: 1px solid ${notificaciones_design.color_borde};
        }

        .encabezado h2 {
          margin: 0;
          color: ${notificaciones_design.color_texto_primario};
          font-family: ${notificaciones_design.tipografia_titulos};
          font-size: 20px;
          font-weight: 700;
        }

        .encabezado p {
          margin: 4px 0 0;
          color: ${notificaciones_design.color_texto_secundario};
          font-size: 12px;
        }

        .lista-notificaciones {
          max-height: 390px;
          overflow-y: auto;
        }

        .estado {
          margin: 0;
          padding: 32px 20px;
          color: ${notificaciones_design.color_texto_secundario};
          font-size: 14px;
          line-height: 1.5;
          text-align: center;
        }

        .estado-error {
          color: ${notificaciones_design.color_peligro_texto};
          background: ${notificaciones_design.color_peligro_fondo};
        }

        @media (max-width: 640px) {
          .panel-notificaciones {
            position: fixed;
            top: 130px;
            left: 16px;
            right: 16px;
            width: auto;
            max-height: calc(100vh - 150px);
          }

          .lista-notificaciones {
            max-height: calc(100vh - 280px);
          }
        }
      `}</style>
    </div>
  );
}