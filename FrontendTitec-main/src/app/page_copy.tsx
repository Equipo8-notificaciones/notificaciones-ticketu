"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const targets = document.querySelectorAll(".scroll-horizontal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const cronicasCulto = [
    {
      fase: "Canto I",
      epoca: "La Herejía del Monolito (2024)",
      titulo: "La Gran Herejía y el Sacrificio de medianoche",
      dogma: "El falso dios de los servidores ha muerto",
      profecia:
        "Durante eones veneramos al Ídolo Monolítico. Exigía horas de penitencia en salas de espera estáticas y devoraba las almas de los inocentes con errores 500 mientras falsos profetas revendían tickets duplicados en las sombras. Fue necesario encender la pira y ver arder sus hilos de ejecución para siempre.",
    },
    {
      fase: "Canto II",
      epoca: "El Cónclave de las Catacumbas (2025)",
      titulo: "El Juramento de Sangre de los Nueve Apóstoles",
      dogma: "Nueve sellos para gobernar la concurrencia",
      profecia:
        "Nueve sumos sacerdotes del código descendieron a las bóvedas bajo la facultad de ingeniería. Alrededor de un router humeante y café ritual, fundaron la Hermandad de los Nueve Sellos. Juraron que jamás un devoto se quedaría a oscuras y tallaron en silicio las sagradas tablas del API Gateway.",
    },
    {
      fase: "Canto III",
      epoca: "La Comunión Perpetua (2026)",
      titulo: "El Bautismo del Haz Láser: Nace TicketU",
      dogma: "Consagración inmediata en 0.003 segundos",
      profecia:
        "A las 03:42 AM, el Gateway entonó su primer salmo sin interrupción. Los creyentes recibieron sus sellos criptográficos. Las puertas del templo se abrieron con validación láser instantánea. Hoy TicketU no es una plataforma: es el culto absoluto que conduce a las masas hacia el éxtasis del evento en vivo.",
    },
  ];

  const circulosSagrados = [
    {
      codigo: "CIRCULO-I",
      grupo: "Grupo 1",
      titulo: "El Templo del Velo (Auth)",
      cargo: "Custodia de Almas",
      mandamiento:
        "Solo los elegidos reciben el sello JWT sagrado. Quien no posea la firma criptográfica será desterrado al vacío exterior.",
      ruta: "/auth",
      alineacion: "from-left",
    },
    {
      codigo: "CIRCULO-II",
      grupo: "Grupo 2",
      titulo: "El Grimorio del Firmamento (Catálogo)",
      cargo: "Revelación Litúrgica",
      mandamiento:
        "Las escrituras vivientes que profetizan cada misa, festival y aquelarre masivo en tiempo real con precisión milimétrica.",
      ruta: "/catalogo",
      alineacion: "from-right",
    },
    {
      codigo: "CIRCULO-III",
      grupo: "Grupo 3",
      titulo: "El Relicario de los Cupos (Entradas)",
      cargo: "Tabernáculo de Cupos",
      mandamiento:
        "La custodia inmutable del inventario consagrado. Ni un alma de más, ni un asiento profanado por la sobreventa.",
      ruta: "/entradas",
      alineacion: "from-left",
    },
    {
      codigo: "CIRCULO-IV",
      grupo: "Grupo 4",
      titulo: "El Altar del Tributo (Pagos)",
      cargo: "Ministerio de Ofrendas",
      mandamiento:
        "Canalización sacramental de diezmos bajo el escudo de Stripe Fortress. Transacciones selladas bajo secreto de confesión.",
      ruta: "/pagos",
      alineacion: "from-right",
    },
    {
      codigo: "CIRCULO-V",
      grupo: "Grupo 5",
      titulo: "El Tribunal del Haz Láser (Check-in)",
      cargo: "Purificación en Puerta",
      mandamiento:
        "La prueba suprema del umbral. El haz óptico juzga tu código QR en 0.003 segundos: los fieles cruzan, los impostores caen.",
      ruta: "/checkin",
      alineacion: "from-left",
    },
    {
      codigo: "CIRCULO-VI",
      grupo: "Grupo 7",
      titulo: "El Cónclave de Patriarcas (Organizador)",
      cargo: "Soberanía y Mando",
      mandamiento:
        "El trono desde donde los sumos sacerdotes diseñan rituales multitudinarios, decretan aforos y supervisan las ofrendas.",
      ruta: "/organizador",
      alineacion: "from-right",
    },
    {
      codigo: "CIRCULO-VII",
      grupo: "Grupo 9",
      titulo: "El Fuego de las Indulgencias (Promociones)",
      cargo: "Gracia y Absolución",
      mandamiento:
        "Inyección divina de cupones y rebajas para premiar la fidelidad ciega de los devotos más constantes del culto.",
      ruta: "/promociones",
      alineacion: "from-left",
    },
    {
      codigo: "CIRCULO-VIII",
      grupo: "Grupo 8",
      titulo: "El Susurro de las Campanas (Notificaciones)",
      cargo: "Telepatía Omnicanal",
      mandamiento:
        "La voz invisible que despierta a los fieles cuando el rito inicia o cuando las campanas anuncian la apertura del templo.",
      ruta: "/notificaciones",
      alineacion: "from-right",
    },
    {
      codigo: "CIRCULO-IX",
      grupo: "Grupo 6",
      titulo: "El Testimonio de los Creyentes (Reseñas)",
      cargo: "Inquisición de la Fe",
      mandamiento:
        "Las crónicas inalterables dejadas por quienes presenciaron la gloria del escenario y regresaron para cantar sus alabanzas.",
      ruta: "/catalogo/1/resenas",
      alineacion: "from-left",
    },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulseHalo {
          0%, 100% { box-shadow: 0 0 15px rgba(79, 70, 229, 0.2), inset 0 0 10px rgba(79, 70, 229, 0.1); }
          50% { box-shadow: 0 0 30px rgba(79, 70, 229, 0.45), inset 0 0 20px rgba(79, 70, 229, 0.2); }
        }
        @keyframes floatRelic {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1deg); }
        }
        .cult-wrapper {
          position: relative;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
        }
        .sacred-mesh {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 700px;
          background-image: 
            radial-gradient(circle at 50% 10%, rgba(47, 67, 116, 0.08) 0%, transparent 60%),
            linear-gradient(to right, rgba(47, 67, 116, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(47, 67, 116, 0.04) 1px, transparent 1px);
          background-size: 100% 100%, 36px 36px, 36px 36px;
          pointer-events: none;
          z-index: 0;
        }
        .hero-cult {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem 4rem 1.5rem;
          text-align: center;
        }
        .cult-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #1E293B;
          color: #E2E8F0;
          border: 1px solid #334155;
          padding: 8px 20px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 2rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }
        .flame-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 0 10px #F59E0B;
        }
        .cult-title {
          font-size: clamp(2.6rem, 5.5vw, 4.5rem);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.035em;
          color: #0F172A;
          max-width: 980px;
          margin: 0 auto 1.5rem auto;
        }
        .sacred-glow-text {
          background: linear-gradient(135deg, #1E2D50 0%, #4338CA 50%, #6D28D9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cult-subtitle {
          font-size: clamp(1.1rem, 2vw, 1.3rem);
          line-height: 1.7;
          color: #475569;
          max-width: 820px;
          margin: 0 auto 2.5rem auto;
        }
        .hero-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 3.5rem;
        }
        .btn-initiation {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background-color: #2F4374;
          color: #FFFFFF;
          padding: 15px 30px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          box-shadow: 0 10px 25px -4px rgba(47, 67, 116, 0.45);
          transition: all 0.3s ease;
        }
        .btn-initiation:hover {
          background-color: #1A2744;
          transform: translateY(-3px);
          box-shadow: 0 15px 30px -4px rgba(47, 67, 116, 0.6);
        }
        .btn-sacred-altar {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #FFFFFF;
          color: #2F4374;
          border: 1.5px solid #CBD5E1;
          padding: 15px 30px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn-sacred-altar:hover {
          background: #F1F5F9;
          border-color: #94A3B8;
          transform: translateY(-3px);
        }
        .marquee-banner {
          width: 100%;
          overflow: hidden;
          background: #0B1120;
          color: #94A3B8;
          padding: 14px 0;
          border-top: 1px solid #1E293B;
          border-bottom: 1px solid #1E293B;
          white-space: nowrap;
          position: relative;
        }
        .marquee-inner {
          display: flex;
          width: max-content;
          animation: marqueeScroll 35s linear infinite;
        }
        .marquee-inner:hover {
          animation-play-state: paused;
        }
        .marquee-verse {
          display: inline-flex;
          align-items: center;
          gap: 24px;
          padding: 0 24px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #CBD5E1;
        }
        .marquee-sep {
          color: #6366F1;
          font-size: 16px;
        }
        .scroll-horizontal {
          opacity: 0;
          transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .scroll-horizontal.from-left {
          transform: translateX(-90px);
        }
        .scroll-horizontal.from-right {
          transform: translateX(90px);
        }
        .scroll-horizontal.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .stats-altar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1.5rem;
          max-width: 1080px;
          margin: 0 auto;
          background: #FFFFFF;
          padding: 2rem;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 16px 35px -8px rgba(0, 0, 0, 0.07);
        }
        .altar-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .stat-figure {
          font-size: 2.2rem;
          font-weight: 900;
          color: #2F4374;
          letter-spacing: -0.03em;
        }
        .stat-rite {
          font-size: 12px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .chronicles-wrapper {
          max-width: 1100px;
          margin: 5rem auto;
          padding: 0 1.5rem;
        }
        .chronicle-box {
          background: #0B1120;
          border: 1px solid #1E293B;
          border-radius: 22px;
          padding: 3.5rem;
          color: #F8FAFC;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5);
          position: relative;
        }
        .tab-ritual-container {
          display: flex;
          gap: 12px;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }
        .tab-ritual-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94A3B8;
          padding: 10px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .tab-ritual-btn.active {
          background: #4338CA;
          border-color: #6366F1;
          color: #FFFFFF;
          box-shadow: 0 4px 18px rgba(99, 102, 241, 0.4);
        }
        .chronicle-fase {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #F59E0B;
          margin-bottom: 8px;
        }
        .chronicle-heading {
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          font-weight: 900;
          color: #FFFFFF;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }
        .chronicle-dogma {
          font-size: 1.15rem;
          color: #A5B4FC;
          font-style: italic;
          margin-bottom: 1.5rem;
        }
        .chronicle-text {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #94A3B8;
          max-width: 860px;
        }
        .circles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 2rem;
          max-width: 1220px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .circle-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-decoration: none;
          color: inherit;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .circle-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2F4374, #4F46E5);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .circle-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 22px 35px -10px rgba(47, 67, 116, 0.15);
          border-color: #6366F1;
        }
        .circle-card:hover::after {
          opacity: 1;
        }
        .circle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .circle-icon-seal {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #F1F5F9;
          border: 1px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2F4374;
          transition: all 0.3s ease;
        }
        .circle-card:hover .circle-icon-seal {
          background: #2F4374;
          color: #FFFFFF;
          border-color: #2F4374;
          transform: rotate(6deg) scale(1.08);
        }
        .seal-tag {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: #EEF2FF;
          color: #4338CA;
          padding: 4px 10px;
          border-radius: 999px;
        }
        .circle-role {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #6366F1;
          margin-bottom: 6px;
        }
        .circle-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 0.75rem 0;
          line-height: 1.3;
        }
        .circle-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #64748B;
          margin: 0 0 1.75rem 0;
        }
        .circle-link-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #2F4374;
          transition: gap 0.2s ease, color 0.2s ease;
        }
        .circle-card:hover .circle-link-label {
          gap: 12px;
          color: #4338CA;
        }
        .credo-box {
          max-width: 1150px;
          margin: 6rem auto 3rem auto;
          padding: 0 1.5rem;
        }
        .credo-card {
          background: linear-gradient(135deg, #1A2643 0%, #0F172A 100%);
          border-radius: 24px;
          padding: 4rem 2rem;
          color: #FFFFFF;
          text-align: center;
          border: 1px solid #334155;
          box-shadow: 0 30px 60px -15px rgba(15, 23, 42, 0.6);
        }
        .credo-title {
          font-size: clamp(2.2rem, 4.5vw, 3.2rem);
          font-weight: 900;
          margin: 0 0 1.25rem 0;
          letter-spacing: -0.02em;
        }
        .credo-quote {
          font-size: 1.2rem;
          line-height: 1.8;
          color: #CBD5E1;
          max-width: 780px;
          margin: 0 auto 2.5rem auto;
        }
      `}} />

      <div className="cult-wrapper">
        <div className="sacred-mesh" />

        {/* Hero Section del Culto */}
        <section className="hero-cult">
          <div className="cult-badge">
            <span className="flame-dot" />
            HERMANDAD DE LOS NUEVE SELLOS // RITO V4.2
          </div>

          <h1 className="cult-title">
            No Vendemos Entradas.{" "}
            <span className="sacred-glow-text">Consagramos Almas en el Escenario.</span>
          </h1>

          <p className="cult-subtitle">
            El Monolito profano ha caído. De sus cenizas se alzó TicketU: no somos una red, somos el culto supremo que custodia el acceso sagrado a cada concierto, festival y congregación masiva. Sin filas, sin reventa y sin falsos profetas.
          </p>

          <div className="hero-actions">
            <Link href="/catalogo" className="btn-initiation">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Iniciar Peregrinación al Catálogo
            </Link>

            <Link href="/organizador" className="btn-sacred-altar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Altar del Sumo Organizador
            </Link>
          </div>

          {/* Estadísticas Sagradas */}
          <div className="stats-altar">
            <div className="altar-stat">
              <span className="stat-figure">9</span>
              <span className="stat-rite">Círculos de Iniciación</span>
            </div>
            <div className="altar-stat">
              <span className="stat-figure">0.003s</span>
              <span className="stat-rite">Purificación de Entrada</span>
            </div>
            <div className="altar-stat">
              <span className="stat-figure">100%</span>
              <span className="stat-rite">Inmunidad a la Reventa</span>
            </div>
            <div className="altar-stat">
              <span className="stat-figure">Inmortal</span>
              <span className="stat-rite">Tolerancia Litúrgica a Fallos</span>
            </div>
          </div>
        </section>

        {/* Marquee Ticker de Movimiento Horizontal Continuo */}
        <div className="marquee-banner" aria-hidden="true">
          <div className="marquee-inner">
            <div className="marquee-verse">
              <span>EL MONOLITO HA ARDIDO</span>
              <span className="marquee-sep">//</span>
              <span>NO HAY MÁS DIOS QUE EL GATEWAY</span>
              <span className="marquee-sep">//</span>
              <span>NINGÚN DEVOTO SIN ENTRADA</span>
              <span className="marquee-sep">//</span>
              <span>PURIFICACIÓN QR EN 0.003 SEGUNDOS</span>
              <span className="marquee-sep">//</span>
              <span>CONGREGACIÓN DE LOS NUEVE APÓSTOLES</span>
              <span className="marquee-sep">//</span>
              <span>TICKET-U ES LA FE ABSOLUTA</span>
              <span className="marquee-sep">//</span>
            </div>
            <div className="marquee-verse">
              <span>EL MONOLITO HA ARDIDO</span>
              <span className="marquee-sep">//</span>
              <span>NO HAY MÁS DIOS QUE EL GATEWAY</span>
              <span className="marquee-sep">//</span>
              <span>NINGÚN DEVOTO SIN ENTRADA</span>
              <span className="marquee-sep">//</span>
              <span>PURIFICACIÓN QR EN 0.003 SEGUNDOS</span>
              <span className="marquee-sep">//</span>
              <span>CONGREGACIÓN DE LOS NUEVE APÓSTOLES</span>
              <span className="marquee-sep">//</span>
              <span>TICKET-U ES LA FE ABSOLUTA</span>
              <span className="marquee-sep">//</span>
            </div>
          </div>
        </div>

        {/* Crónicas Sagradas del Culto (Historia con animación horizontal al bajar) */}
        <section className="chronicles-wrapper">
          <div className="scroll-horizontal from-left" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#6366F1", letterSpacing: "2px", textTransform: "uppercase" }}>
              Las Santas Escrituras
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: "900", color: "#0F172A", margin: "0.5rem 0" }}>
              El Génesis del Culto
            </h2>
            <p style={{ color: "#64748B", fontSize: "1.05rem", maxWidth: "680px", margin: "0 auto" }}>
              Cómo nueve apóstoles del código destruyeron la falsa religión de los servidores caídos para fundar la comunión definitiva.
            </p>
          </div>

          <div className="chronicle-box scroll-horizontal from-right">
            <div className="tab-ritual-container">
              {cronicasCulto.map((cap, idx) => (
                <button
                  key={cap.fase}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`tab-ritual-btn ${activeTab === idx ? "active" : ""}`}
                >
                  {cap.fase}: {cap.epoca}
                </button>
              ))}
            </div>

            <div>
              <div className="chronicle-fase">{cronicasCulto[activeTab].fase} // {cronicasCulto[activeTab].epoca}</div>
              <h3 className="chronicle-heading">{cronicasCulto[activeTab].titulo}</h3>
              <div className="chronicle-dogma">{cronicasCulto[activeTab].dogma}</div>
              <p className="chronicle-text">{cronicasCulto[activeTab].profecia}</p>
            </div>
          </div>
        </section>

        {/* Los 9 Círculos de Iniciación (Animación horizontal alternada al bajar) */}
        <section id="circulos" style={{ padding: "3rem 0 5rem 0" }}>
          <div className="scroll-horizontal from-left" style={{ textAlign: "center", marginBottom: "3.5rem", padding: "0 1.5rem" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#4338CA", letterSpacing: "2px", textTransform: "uppercase" }}>
              Los Nueve Guardianes de la Fe
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: "900", color: "#0F172A", margin: "0.5rem 0" }}>
              Los Nueve Círculos Sagrados
            </h2>
            <p style={{ color: "#64748B", fontSize: "1.05rem", maxWidth: "680px", margin: "0 auto" }}>
              Cada círculo custodia un sacramento inquebrantable de la liturgia. Ingresa en ellos para dar testimonio.
            </p>
          </div>

          <div className="circles-grid">
            {circulosSagrados.map((circulo) => (
              <Link
                key={circulo.codigo}
                href={circulo.ruta}
                className={`circle-card scroll-horizontal ${circulo.alineacion}`}
              >
                <div>
                  <div className="circle-header">
                    <div className="circle-icon-seal">
                      {circulo.codigo === "CIRCULO-I" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z" />
                          <circle cx="12" cy="16" r="2" />
                        </svg>
                      )}
                      {circulo.codigo === "CIRCULO-II" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                      )}
                      {circulo.codigo === "CIRCULO-III" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      )}
                      {circulo.codigo === "CIRCULO-IV" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                      )}
                      {circulo.codigo === "CIRCULO-V" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="22" y1="12" x2="18" y2="12" />
                          <line x1="6" y1="12" x2="2" y2="12" />
                          <line x1="12" y1="6" x2="12" y2="2" />
                          <line x1="12" y1="22" x2="12" y2="18" />
                        </svg>
                      )}
                      {circulo.codigo === "CIRCULO-VI" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                          <path d="M5 19h14v2H5z" />
                        </svg>
                      )}
                      {circulo.codigo === "CIRCULO-VII" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      )}
                      {circulo.codigo === "CIRCULO-VIII" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <line x1="10" y1="21" x2="14" y2="21" />
                        </svg>
                      )}
                      {circulo.codigo === "CIRCULO-IX" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )}
                    </div>
                    <span className="seal-tag">{circulo.grupo}</span>
                  </div>

                  <div className="circle-role">{circulo.cargo}</div>
                  <h3 className="circle-title">{circulo.titulo}</h3>
                  <p className="circle-desc">{circulo.mandamiento}</p>
                </div>

                <div className="circle-link-label">
                  Consagrarse en el círculo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Credo Final del Culto */}
        <section className="credo-box">
          <div className="credo-card scroll-horizontal from-right">
            <h2 className="credo-title">El Credo Sagrado del Gateway</h2>
            <p className="credo-quote">
              &ldquo;Un solo punto de comunión divina. Nueve sacramentos independientes que jamás se contaminan entre sí. Ni la avalancha de mil peticiones simultáneas quebrantará la fe de los devotos de TicketU.&rdquo;
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/catalogo" className="btn-sacred-altar" style={{ border: "none" }}>
                Ver Congregaciones Disponibles
              </Link>
              <Link href="/auth" className="btn-initiation" style={{ backgroundColor: "#4338CA" }}>
                Comulgar en la Red Sagrada
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
