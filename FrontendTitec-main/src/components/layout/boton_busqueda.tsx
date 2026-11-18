"use client";

import React from 'react';
import Link from 'next/link';

export default function SearchButton() {
  return (
    <Link
      href="/catalogo"
      title="Buscar eventos en el catálogo"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        border: "1.5px solid #FFFFFF",
        borderRadius: "6px",
        padding: "4px 8px",
        color: "#FFFFFF",
        textDecoration: "none",
        cursor: "pointer",
        gap: "2px",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.18)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <span style={{
        fontSize: "10px",
        fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0.5px"
      }}>
        BUSCAR
      </span>
    </Link>
  );
}
