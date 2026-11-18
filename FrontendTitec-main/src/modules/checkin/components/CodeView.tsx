"use client";

import { useState } from "react";
import { ArrowLeft, Search, AlertCircle } from "./icons";
import { ScanResultInfo } from "../types";
import { validarTicketCheckin } from "../api";

interface CodeViewProps {
  onBack: () => void;
  onScanResult: (result: ScanResultInfo) => void;
}

export default function CodeView({ onBack, onScanResult }: CodeViewProps) {
  const [code, setCode] = useState("");
  const [eventoId, setEventoId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFeedbackError("Por favor ingresa un código de entrada.");
      return;
    }

    if (!eventoId.trim()) {
      setFeedbackError("Por favor ingresa el identificador del evento.");
      return;
    }

    setFeedbackError("");
    setIsLoading(true);

    try {
      const result = await validarTicketCheckin(code.trim(), eventoId.trim());
      onScanResult(result);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Error al consultar el código.");
    } finally {
      setIsLoading(false);
    }
  };

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
    marginBottom: "16px",
    fontSize: "26px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    color: "#2F4374",
    lineHeight: 1.25,
  };

  const buttonStyle = {
    backgroundColor: "#2F4374",
    color: "#FFFFFF",
    minHeight: "48px",
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
    gap: "8px",
    transition: "background-color 0.2s ease",
  };

  const backButtonStyle = {
    ...buttonStyle,
    backgroundColor: "transparent",
    color: "#2F4374",
    border: "1px solid #D8DFF0",
    marginTop: "8px",
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <h1 style={titleStyle}>Ingreso por código secreto</h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              htmlFor="entry-code"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#2F4374",
                marginBottom: "6px",
              }}
            >
              Código de entrada (id_entrada)
            </label>
            <input
              id="entry-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: tk-1010"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={128}
              required
              style={{
                width: "100%",
                height: "44px",
                padding: "0 12px",
                borderRadius: "8px",
                border: "1px solid #D8DFF0",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#FFFFFF",
                color: "#2F4374",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="event-code"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#2F4374",
                marginBottom: "6px",
              }}
            >
              ID del evento
            </label>
            <input
              id="event-code"
              type="text"
              value={eventoId}
              onChange={(e) => setEventoId(e.target.value)}
              placeholder="Ej: evt-77889"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={128}
              required
              style={{
                width: "100%",
                height: "44px",
                padding: "0 12px",
                borderRadius: "8px",
                border: "1px solid #D8DFF0",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#FFFFFF",
                color: "#2F4374",
              }}
            />
          </div>

          {feedbackError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "#FDF0F2",
                color: "#B3261E",
                fontSize: "13px",
              }}
            >
              <AlertCircle size={16} />
              <span>{feedbackError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={buttonStyle}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = "#24355D";
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = "#2F4374";
            }}
          >
            <Search size={16} />
            <span>{isLoading ? "Consultando..." : "Consultar código"}</span>
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          style={backButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EEF1F8")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>
      </div>
    </div>
  );
}
