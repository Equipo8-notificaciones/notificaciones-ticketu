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
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {cantidad_no_leidas > 0 && (
          <span className="contador">{cantidad_no_leidas}</span>
        )}
      </button>

      <style jsx>{`
        .boton-notificaciones {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.574vw;
          height: 4.667vh;
          padding: 0;
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          border-radius: 50%;
          background-color: transparent;
          color: #ffffff;
          cursor: pointer;
        }

        .boton-notificaciones:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .boton-notificaciones:focus-visible {
          outline: 2px solid ${notificaciones_design.color_acento};
          outline-offset: 2px;
        }

        .campana {
          width: 1.256vw;
          height: 2.222vh;
        }

        .contador {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border: 2px solid #2f4374;
          border-radius: 50%;
          background-color: #b3261e;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
}