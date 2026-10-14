import React from 'react';
import Link from "next/link";

export default function Campana() {
  return (
    <Link href="/notificaciones" aria-label="Notificaciones" style={{
      width: "44px",
      height: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "inherit",
      textDecoration: "none"
    }}>
      <div style={{
        width: "36px",
        height: "36px",
        backgroundColor: "#2F4374",
        borderRadius: "999px",
        border: "2px solid #FFFFFF",
        boxSizing: "border-box", // Evita que el borde sume píxeles extra al ancho/alto
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <line x1="10" y1="21" x2="14" y2="21"></line>
        </svg>
      </div>
    </Link>
  );
}