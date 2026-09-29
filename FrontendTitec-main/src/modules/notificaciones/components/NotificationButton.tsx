import { notificaciones_design } from "./notificacionesDesign";

type NotificationButtonProps = {
  cantidad_no_leidas: number;
  atributo_abierto: boolean;
  atributo_al_clicar: () => void;
};

export default function NotificationButton({
  cantidad_no_leidas,
  atributo_abierto,
  atributo_al_clicar,
}: NotificationButtonProps) {
  return (
    <>
      {/* Sprint 2 — HU3: Mostrar centro de notificaciones desde la esquina superior derecha. */}
      <button
        className="boton-notificaciones"
        onClick={atributo_al_clicar}
        aria-label="Abrir centro de notificaciones"
        aria-expanded={atributo_abierto}
      >
        <svg
          className="campana"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>

        {cantidad_no_leidas > 0 && (
          <span className="contador">{cantidad_no_leidas}</span>
        )}
      </button>

      <style jsx>{`
        .boton-notificaciones {
          position: relative;
          width: 44px;
          height: 44px;
          padding: 0;
          border: 1px solid ${notificaciones_design.color_borde};
          border-radius: 50%;
          background: ${notificaciones_design.color_superficie};
          cursor: pointer;
          display: flex;
          color: ${notificaciones_design.color_texto_primario};
          justify-content: center;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .boton-notificaciones:hover {
          background: ${notificaciones_design.color_fondo_panel};
        }

        .boton-notificaciones:focus-visible {
          outline: 2px solid ${notificaciones_design.color_acento};
          outline-offset: 2px;
        }

        .campana {
          width: 20px;
          height: 20px;
        }

        .contador {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 999px;
          background: ${notificaciones_design.color_peligro_texto};
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
}