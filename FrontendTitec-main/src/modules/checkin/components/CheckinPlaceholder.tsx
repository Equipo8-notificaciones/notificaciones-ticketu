"use client";

import { useState } from "react";
import SelectionView from "./SelectionView";
import ScannerView from "./ScannerView";
import StatusScan from "./StatusScan";
import CodeView from "./CodeView";
import { ScanResultInfo } from "../types";

export default function CheckinPlaceholder() {
  // Estados de navegación interna del módulo
  const [currentView, setCurrentView] = useState<"selection" | "scanner" | "code">("selection");
  const [scanResult, setScanResult] = useState<ScanResultInfo | null>(null);

  // Navegar a vista de escáner QR
  const handleOpenScanner = () => {
    setCurrentView("scanner");
  };

  // Navegar a ingreso manual por código
  const handleOpenCode = () => {
    setCurrentView("code");
  };

  // Volver a la pantalla de selección
  const handleBackToSelection = () => {
    setCurrentView("selection");
  };

  // Recepción de resultado tras lectura de QR o validación
  const handleScanSuccess = (result: ScanResultInfo) => {
    setScanResult(result);
  };

  // Cierre del modal de resultado
  const handleCloseModal = () => {
    setScanResult(null);
  };

  // Escanear nuevamente
  const handleScanAgain = () => {
    setScanResult(null);
    setCurrentView("scanner");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        width: "100%",
        minHeight: "75vh",
        backgroundColor: "#F8F9FA",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {currentView === "selection" && (
        <SelectionView
          onSelectQR={handleOpenScanner}
          onSelectCode={handleOpenCode}
        />
      )}

      {currentView === "scanner" && (
        <ScannerView
          onBack={handleBackToSelection}
          onScan={handleScanSuccess}
        />
      )}

      {currentView === "code" && (
        <CodeView
          onBack={handleBackToSelection}
          onScanResult={handleScanSuccess}
        />
      )}

      {/* Modal de resultado: Lee el QR y muestra qué salió de este */}
      {scanResult && (
        <StatusScan
          status={scanResult}
          onClose={handleCloseModal}
          onScanAgain={handleScanAgain}
        />
      )}
    </div>
  );
}
