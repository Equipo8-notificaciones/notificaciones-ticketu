"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, X, ChevronDown, ChevronUp } from "./icons";
import { ScanResultInfo } from "../types";

interface StatusProps {
  status: ScanResultInfo;
  onClose: () => void;
  onScanAgain?: () => void;
}

export default function StatusScan({ status, onClose, onScanAgain }: StatusProps) {
  const [showRaw, setShowRaw] = useState(false);
  const result = status;

  const isAccepted = result.status === "accepted";
  const isInvalid = result.status === "invalid";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Colores del Design System de Ticket-U
  const themeColors = {
    primary: "#2F4374",
    primaryHover: "#24355D",
    textPrimary: "#2F4374",
    textSecondary: "#6B7A9A",
    border: "#D8DFF0",
    successBg: "#E2F4EA",
    successText: "#1A6640",
    dangerBg: "#FDF0F2",
    dangerText: "#B3261E",
    warningBg: "#FEF7E6",
    warningText: "#8F4F00",
  };

  const statusColor = isAccepted 
    ? themeColors.successText 
    : isInvalid 
    ? themeColors.warningText 
    : themeColors.dangerText;

  const statusBg = isAccepted 
    ? themeColors.successBg 
    : isInvalid 
    ? themeColors.warningBg 
    : themeColors.dangerBg;

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid ${themeColors.border}`,
    fontSize: "14px",
    gap: "12px",
  };

  const labelStyle = {
    color: themeColors.textSecondary,
    fontWeight: 500,
    flexShrink: 0,
  };

  const valueStyle = {
    color: themeColors.textPrimary,
    fontWeight: 600,
    textAlign: "right" as const,
    wordBreak: "break-word" as const,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resultado de validación de entrada"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(17, 24, 39, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 9999,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "12px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          color: themeColors.textPrimary,
          boxShadow: "0px 12px 32px rgba(47, 67, 116, 0.2)",
          position: "relative",
        }}
      >
        {/* Botón cerrar esquina */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: themeColors.textSecondary,
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
          }}
        >
          <X size={20} />
        </button>

        {/* Icono de estado */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto",
            color: statusColor,
            backgroundColor: statusBg,
          }}
        >
          {isAccepted ? (
            <CheckCircle2 size={32} />
          ) : isInvalid ? (
            <AlertTriangle size={32} />
          ) : (
            <XCircle size={32} />
          )}
        </div>

        {/* Título */}
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 6px 0",
            fontSize: "20px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            color: themeColors.textPrimary,
          }}
        >
          {isAccepted
            ? "Acceso Permitido"
            : isInvalid
            ? "QR No Reconocido"
            : "Acceso Denegado"}
        </h2>

        {/* Mensaje descriptivo */}
        <p
          style={{
            textAlign: "center",
            margin: "0 0 20px 0",
            fontSize: "13px",
            color: themeColors.textSecondary,
            lineHeight: 1.4,
          }}
        >
          {result.mensaje || (isAccepted ? "Entrada verificada exitosamente." : "No se pudo acreditar el ingreso.")}
        </p>

        {/* Datos que salieron del QR */}
        <div
          style={{
            backgroundColor: "#F8F9FA",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
            border: `1px solid ${themeColors.border}`,
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: themeColors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            Datos obtenidos de la lectura:
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Estado de validación</span>
            <span
              style={{
                color: statusColor,
                backgroundColor: statusBg,
                padding: "3px 10px",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              {isAccepted ? "Aceptado" : isInvalid ? "Inválido" : "Rechazado"}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Id de la entrada</span>
            <span style={valueStyle}>
              {result.ticket?.id_entrada || "No detectado"}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Id del evento</span>
            <span style={valueStyle}>
              {result.ticket?.id_evento || "No detectado"}
            </span>
          </div>

          {result.ticket?.nombre_usuario && (
            <div style={rowStyle}>
              <span style={labelStyle}>Nombre del asistente</span>
              <span style={valueStyle}>{result.ticket.nombre_usuario}</span>
            </div>
          )}

          <div style={rowStyle}>
            <span style={labelStyle}>Nombre del evento</span>
            <span style={valueStyle}>
              {result.ticket?.nombre_evento || "Evento Ticket-U"}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Dirección</span>
            <span style={valueStyle}>
              {result.ticket?.direccion || "Sede oficial del evento"}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Hora de inicio</span>
            <span style={valueStyle}>
              {result.ticket?.hora_inicio || "09:30 hrs"}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Hora de cierre</span>
            <span style={valueStyle}>
              {result.ticket?.hora_cierre || "18:00 hrs"}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Fecha</span>
            <span style={valueStyle}>
              {result.ticket?.fecha || new Date().toLocaleDateString("es-CL")}
            </span>
          </div>

          {result.timestamp && (
            <div style={{ ...rowStyle, borderBottom: "none" }}>
              <span style={labelStyle}>Hora del escaneo</span>
              <span style={valueStyle}>{result.timestamp}</span>
            </div>
          )}
        </div>

        {/* Sección de contenido crudo / inspección del QR */}
        <div style={{ marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              padding: "6px 0",
              color: themeColors.primary,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <span>{showRaw ? "Ocultar contenido bruto del QR" : "Ver contenido bruto del QR"}</span>
            {showRaw ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showRaw && (
            <pre
              style={{
                marginTop: "8px",
                padding: "10px",
                backgroundColor: "#1E293B",
                color: "#E2E8F0",
                borderRadius: "6px",
                fontSize: "11px",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "120px",
              }}
            >
              {result.rawContent || "Sin contenido adicional en el QR."}
            </pre>
          )}
        </div>

        {/* Botones de acción */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {onScanAgain && (
            <button
              type="button"
              onClick={onScanAgain}
              style={{
                backgroundColor: themeColors.primary,
                color: "#FFFFFF",
                border: "none",
                minHeight: "44px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = themeColors.primary)}
            >
              <RefreshCw size={16} />
              <span>Escanear otro QR</span>
            </button>
          )}

          <button
            type="button"
            autoFocus
            onClick={onClose}
            style={{
              backgroundColor: onScanAgain ? "#FFFFFF" : themeColors.primary,
              color: onScanAgain ? themeColors.textPrimary : "#FFFFFF",
              border: onScanAgain ? `1px solid ${themeColors.border}` : "none",
              minHeight: "44px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
