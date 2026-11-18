"use client";

import { QrCode, KeyRound, MoreHorizontal } from "./icons";

interface SelectionProps {
  onSelectQR: () => void;
  onSelectCode?: () => void;
  onSelectMore?: () => void;
}

export default function SelectionView({ onSelectQR, onSelectCode, onSelectMore }: SelectionProps) {
  const containerStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    flexGrow: 1,
    width: "100%",
    minHeight: "75vh",
    color: "#2F4374",
    padding: "max(48px, env(safe-area-inset-top)) 20px 32px",
    fontFamily: "'Inter', sans-serif",
  };

  const wrapperStyle = {
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  };

  const titleStyle = {
    textAlign: "center" as const,
    marginBottom: "24px",
    fontSize: "28px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    color: "#2F4374",
    lineHeight: 1.25,
  };

  const buttonStyle = {
    backgroundColor: "#2F4374",
    color: "#FFFFFF",
    minHeight: "52px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center" as const,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "0 20px",
    transition: "background-color 0.2s ease",
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <h1 style={titleStyle}>Método de Identificación</h1>

        {/* Opción 1: QR */}
        <button
          type="button"
          style={buttonStyle}
          onClick={onSelectQR}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#24355D")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2F4374")}
        >
          <QrCode size={18} color="#FFFFFF" />
          <span>Ingreso por QR</span>
        </button>

        {/* Opción 2: Código secreto */}
        <button
          type="button"
          style={buttonStyle}
          onClick={onSelectCode}
          disabled={!onSelectCode}
          onMouseEnter={(e) => {
            if (onSelectCode) e.currentTarget.style.backgroundColor = "#24355D";
          }}
          onMouseLeave={(e) => {
            if (onSelectCode) e.currentTarget.style.backgroundColor = "#2F4374";
          }}
        >
          <KeyRound size={18} color="#FFFFFF" />
          <span>Ingreso por código secreto</span>
        </button>

        {/* Opción 3: 3 puntos */}
        <button
          type="button"
          style={buttonStyle}
          onClick={onSelectMore}
          aria-label="Más opciones"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#24355D")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2F4374")}
        >
          <MoreHorizontal size={22} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
}
