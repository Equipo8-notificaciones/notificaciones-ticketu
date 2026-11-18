"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function HomePage() {
  const [currentFolio, setCurrentFolio] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const isUserInteractingRef = useRef<boolean>(false);

  // Las 4 Crónicas de la Historia del Culto dentro del Libro
  const capitulosCulto = [
    {
      folioNumero: "1",
      epoca: "2024",
      titulo: "El Sacrificio del Monolito Central",
      subtitulo: "La Noche del Colapso y el Falso Dios",
      relato:
        "Durante eones veneramos al Ídolo Monolítico. En la noche más caótica de venta de entradas universitarias, colapsó en llamas ante 45.000 peticiones simultáneas. Cientos de devotos quedaron en la intemperie mientras falsos revendedores duplicaban tickets en las sombras. Fue necesario encender la pira y quemar sus hilos de ejecución para siempre.",
      dogmaTitulo: "Salmo de Purificación",
      dogmaCita:
        "“El falso dios de los servidores ha muerto. Su error 500 jamás volverá a mancillar la fe de los devotos de la música.”",
      liturgia:
        "El fuego consumió el código espagueti. De sus cenizas frías surgió la revelación: la sincronicidad perpetua solo se alcanza fragmentando el poder en 9 sellos sagrados.",
      botonSiguiente: "Pasar al Cónclave (Folio II) →",
    },
    {
      folioNumero: "2",
      epoca: "2025",
      titulo: "El Juramento de Sangre de los Nueve Apóstoles",
      subtitulo: "El Cónclave de las Catacumbas de Ingeniería",
      relato:
        "Nueve sumos sacerdotes del silicio descendieron al sótano más oscuro del pabellón de ciencias. Alrededor de un router humeante y café frío ritual, juraron con sangre binaria erradicar las colas de espera. En los muros de cemento tallaron las tablas sagradas del API Gateway: un único canal público para gobernar a todos los microservicios.",
      dogmaTitulo: "El Pacto Distribuido",
      dogmaCita:
        "“Nueve microservicios consagrados, inmunes a la caída del hermano. Si uno titubea, el altar sigue en pie.”",
      liturgia:
        "Se dividió el reino: Auth, Catálogo, Entradas, Pagos, Check-in, Organizador, Promociones, Notificaciones y Reseñas. Cada facción juró autonomía absoluta bajo RabbitMQ.",
      botonSiguiente: "Pasar al Bautismo (Folio III) →",
    },
    {
      folioNumero: "3",
      epoca: "2026",
      titulo: "El Bautismo del Haz Óptico: Nace TicketU",
      subtitulo: "La Consagración del Protocolo Zero-Downtime",
      relato:
        "A las 03:42 AM se ejecutó el despliegue final. El Gateway entonó su primer salmo sin interrupciones. Las puertas de los festivales se abrieron con validación criptográfica instantánea. Los fieles descubrieron la comunión perfecta: boletos inquebrantables, cero reventa y entrada al templo en 0.003 segundos.",
      dogmaTitulo: "El Rito del Acceso Inmortal",
      dogmaCita:
        "“No compres un boleto profano en el azar de la calle: consagra tu presencia en el altar de TicketU.”",
      liturgia:
        "El monopolio de las viejas ticketeras ardió. La multitud ahora accede en comunión directa, segura y transparente.",
      botonSiguiente: "Ver los 9 Círculos (Folio IV) →",
    },
    {
      folioNumero: "4",
      epoca: "Presente",
      titulo: "Los Nueve Círculos y la Comunión Suprema",
      subtitulo: "El Panteón Activo de la Fe",
      relato:
        "Hoy el culto gobierna la totalidad del evento en vivo. Desde la reserva atómica del asiento hasta el control láser en puerta y el pago blindado con Stripe. Cada módulo es un círculo de devoción preparado para resistir las avalanchas de tráfico más implacables del universo.",
      dogmaTitulo: "El Credo Supremo",
      dogmaCita:
        "“Un solo Gateway divino. Nueve sacramentos autónomos. Ni mil millones de peticiones quebrar la fe de los devotos.”",
      liturgia:
        "Todo está listo para tu iniciación. Explora los eventos del catálogo o consagra tu alma en la red de autenticación.",
      botonSiguiente: "Reiniciar el Génesis (Folio I) ↺",
    },
  ];

  // Cambio de folio con animación 3D
  const cambiarFolio = (nuevoIndice: number) => {
    if (nuevoIndice === currentFolio || isFlipping) return;
    isUserInteractingRef.current = true;
    setIsFlipping(true);

    setTimeout(() => {
      setCurrentFolio(nuevoIndice);
    }, 400);

    setTimeout(() => {
      setIsFlipping(false);
      isUserInteractingRef.current = false;
    }, 850);
  };

  // Scroll observer para sincronizar las páginas con el desplazamiento
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

    // Observador para secciones que actualizan el libro automáticamente al bajar
    const seccionInicio = document.getElementById("hero-seccion");
    const seccionLibro = document.getElementById("libro-seccion");
    const seccionCirculos = document.getElementById("circulos-seccion");
    const seccionCredo = document.getElementById("credo-seccion");

    const bookObserver = new IntersectionObserver(
      (entries) => {
        if (isUserInteractingRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.id === "hero-seccion") {
              setCurrentFolio(0);
            } else if (entry.target.id === "libro-seccion") {
              // Permanece en el folio actual o pasa a 1 si estaba en 0
              setCurrentFolio((prev) => (prev === 0 ? 1 : prev));
            } else if (entry.target.id === "circulos-seccion") {
              setCurrentFolio(2);
            } else if (entry.target.id === "credo-seccion") {
              setCurrentFolio(3);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    if (seccionInicio) bookObserver.observe(seccionInicio);
    if (seccionLibro) bookObserver.observe(seccionLibro);
    if (seccionCirculos) bookObserver.observe(seccionCirculos);
    if (seccionCredo) bookObserver.observe(seccionCredo);

    return () => {
      observer.disconnect();
      bookObserver.disconnect();
    };
  }, []);

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

  const folioActual = capitulosCulto[currentFolio];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pageTurningTurn {
          0% {
            transform: rotateY(0deg);
            opacity: 1;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
          }
          50% {
            transform: rotateY(-90deg) scale(1.05);
            opacity: 0.95;
            box-shadow: -25px 0 45px rgba(0, 0, 0, 0.8);
          }
          100% {
            transform: rotateY(-180deg);
            opacity: 0;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
          }
        }
        @keyframes subtleDriftAsh {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-300px) translateX(25px); opacity: 0; }
        }

        /* FONDO: CUADERNO QUEMADO AZULADO (Expande la caja para usar toda la pantalla sin tocar layout) */
        .burnt-notebook-root {
          position: relative;
          color: #E2E8F0;
          font-family: var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif;
          background-color: #070B14;
          background-image: 
            /* Viñeta perimetral de carbón quemado profundo */
            radial-gradient(ellipse at 50% 12%, rgba(47, 67, 116, 0.3) 0%, rgba(13, 21, 38, 0.9) 60%, #050811 100%),
            /* Líneas de cuaderno antiguo azulado */
            repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(47, 67, 116, 0.12) 31px, rgba(47, 67, 116, 0.12) 32px),
            /* Manchas de papel vegetal azul quemado */
            radial-gradient(circle at 10% 25%, rgba(47, 67, 116, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 90% 75%, rgba(30, 45, 80, 0.22) 0%, transparent 45%);
          min-height: calc(100vh - 64px);
          margin: -1rem -2rem;
          padding: 0 0 4rem 0;
          overflow-x: hidden;
        }

        /* Margen de costura lateral de cuaderno litúrgico */
        .burnt-notebook-root::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: clamp(16px, 3.5vw, 48px);
          width: 2px;
          background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.25) 15%, rgba(47, 67, 116, 0.35) 85%, transparent);
          pointer-events: none;
          z-index: 1;
        }

        h1, h2, h3, h4, .tome-heading, .cult-title, .section-title-cult, .credo-title {
          font-family: var(--font-poppins), 'Poppins', sans-serif;
        }

        /* Cenizas flotantes de cuaderno quemado */
        .ash-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #818CF8;
          pointer-events: none;
          opacity: 0;
        }

        /* HERO SECTION */
        .hero-cult-altar {
          position: relative;
          z-index: 2;
          max-width: 1100px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem 2.5rem 1.5rem;
          text-align: center;
        }
        .cult-title {
          font-size: clamp(2.6rem, 5.2vw, 4.4rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.035em;
          color: #FFFFFF;
          margin: 0 auto 1.5rem auto;
          text-shadow: 0 4px 25px rgba(0, 0, 0, 0.8);
        }
        .sacred-glow-text {
          background: linear-gradient(135deg, #A5B4FC 0%, #6366F1 50%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cult-subtitle {
          font-size: clamp(1.1rem, 2vw, 1.25rem);
          line-height: 1.75;
          color: #94A3B8;
          max-width: 820px;
          margin: 0 auto 2.5rem auto;
        }
        .hero-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }
        .btn-initiation {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background-color: #2F4374;
          color: #FFFFFF;
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          box-shadow: 0 10px 25px -4px rgba(47, 67, 116, 0.6);
          border: 1px solid #4F6BFF;
          transition: all 0.25s ease;
        }
        .btn-initiation:hover {
          background-color: #1E2D50;
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -4px rgba(79, 107, 255, 0.5);
        }
        .btn-sacred-altar {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.85);
          color: #E2E8F0;
          border: 1.5px solid #2F4374;
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.25s ease;
        }
        .btn-sacred-altar:hover {
          background: #1E2D50;
          border-color: #6366F1;
          color: #FFFFFF;
          transform: translateY(-2px);
        }

        /* Estadísticas de la Liturgia */
        .stats-altar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1.5rem;
          max-width: 1080px;
          margin: 0 auto;
          background: #0D1629;
          padding: 2rem;
          border-radius: 16px;
          border: 1.5px solid #2F4374;
          box-shadow: 
            0 20px 45px -10px rgba(0, 0, 0, 0.8),
            inset 0 0 40px rgba(0, 0, 0, 0.6);
        }
        .altar-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .stat-figure {
          font-size: 2.3rem;
          font-weight: 900;
          color: #A5B4FC;
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

        /* EL LIBRO DE LAS CRÓNICAS DEL CULTO */
        .grimoire-viewport {
          perspective: 1600px;
          max-width: 1060px;
          margin: 4rem auto;
          padding: 0 1.5rem;
          position: relative;
          z-index: 5;
        }
        .grimoire-stage {
          position: relative;
          width: 100%;
          min-height: 480px;
          background: #0C1424;
          border-radius: 18px;
          border: 2px solid #2F4374;
          box-shadow: 
            0 35px 80px -15px rgba(0, 0, 0, 0.9),
            0 0 50px rgba(47, 67, 116, 0.35),
            inset 0 0 60px rgba(4, 7, 15, 0.9);
          display: flex;
          transform-style: preserve-3d;
          overflow: visible;
        }

        /* Lomo central de encuadernación */
        .grimoire-spine {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 30px;
          transform: translateX(-50%);
          background: linear-gradient(90deg, #070B14 0%, #1E2D50 50%, #070B14 100%);
          z-index: 12;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          padding: 12px 0;
        }
        .spine-stitch {
          width: 14px;
          height: 3px;
          background: #4F46E5;
          border-radius: 2px;
          box-shadow: 0 0 6px #6366F1;
        }

        /* Páginas izquierda y derecha del libro */
        .grimoire-half-left, .grimoire-half-right {
          width: 50%;
          padding: 3rem 2.5rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 4;
        }
        .grimoire-half-left {
          background: 
            radial-gradient(circle at 10% 50%, #15223C 0%, #0B1222 100%),
            repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(47, 67, 116, 0.15) 27px, rgba(47, 67, 116, 0.15) 28px);
          border-right: 1px solid rgba(0, 0, 0, 0.5);
          box-shadow: inset 20px 0 40px rgba(0, 0, 0, 0.7);
          border-top-left-radius: 16px;
          border-bottom-left-radius: 16px;
        }
        .grimoire-half-right {
          background: 
            radial-gradient(circle at 90% 50%, #15223C 0%, #0B1222 100%),
            repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(47, 67, 116, 0.15) 27px, rgba(47, 67, 116, 0.15) 28px);
          border-left: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: inset -20px 0 40px rgba(0, 0, 0, 0.7);
          border-top-right-radius: 16px;
          border-bottom-right-radius: 16px;
        }

        /* Hoja animada en 3D (Solo visible durante la animación de volteo) */
        .grimoire-turning-leaf {
          position: absolute;
          right: 0;
          top: 0;
          width: 50%;
          height: 100%;
          transform-origin: left center;
          transform-style: preserve-3d;
          z-index: 20;
          pointer-events: none;
          background: linear-gradient(135deg, #15223C 0%, #0D1629 100%);
          border-left: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 0 16px 16px 0;
          animation: pageTurningTurn 0.85s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
        }

        /* Pestañas de Folios */
        .folio-tabs-bar {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }
        .folio-tab-button {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid #2F4374;
          color: #94A3B8;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .folio-tab-button:hover {
          color: #FFFFFF;
          border-color: #6366F1;
          background: rgba(47, 67, 116, 0.4);
        }
        .folio-tab-button.active {
          background: #2F4374;
          color: #FFFFFF;
          border-color: #818CF8;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
        }

        /* Secciones */
        .burnt-section-wrapper {
          position: relative;
          z-index: 2;
          padding: 4.5rem 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-header-cult {
          text-align: center;
          margin-bottom: 3.5rem;
        }
        .section-tag-cult {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #818CF8;
          display: inline-block;
          margin-bottom: 8px;
        }
        .section-title-cult {
          font-size: clamp(2rem, 4vw, 2.9rem);
          font-weight: 900;
          color: #FFFFFF;
          margin: 0 0 0.75rem 0;
          letter-spacing: -0.02em;
        }
        .section-desc-cult {
          color: #94A3B8;
          font-size: 1.05rem;
          max-width: 680px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Tarjetas de los 9 Círculos */
        .circles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 2rem;
        }
        .circle-card {
          background: #0D1629;
          border: 1.5px solid #1E2D50;
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
          box-shadow: 
            0 15px 35px -10px rgba(0, 0, 0, 0.7),
            inset 0 0 30px rgba(0, 0, 0, 0.5);
        }
        .circle-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: #6366F1;
          background: #111D36;
          box-shadow: 
            0 25px 45px -10px rgba(47, 67, 116, 0.4),
            inset 0 0 40px rgba(79, 70, 229, 0.15);
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
          background: #15223C;
          border: 1px solid #2F4374;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #818CF8;
          transition: all 0.3s ease;
        }
        .circle-card:hover .circle-icon-seal {
          background: #2F4374;
          color: #FFFFFF;
          border-color: #818CF8;
          transform: rotate(6deg) scale(1.1);
        }
        .seal-tag {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: rgba(47, 67, 116, 0.35);
          color: #A5B4FC;
          border: 1px solid #2F4374;
          padding: 4px 10px;
          border-radius: 999px;
        }
        .circle-role {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #818CF8;
          margin-bottom: 6px;
        }
        .circle-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 0.75rem 0;
          line-height: 1.3;
        }
        .circle-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #94A3B8;
          margin: 0 0 1.75rem 0;
        }
        .circle-link-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #A5B4FC;
          transition: gap 0.2s ease, color 0.2s ease;
        }
        .circle-card:hover .circle-link-label {
          gap: 12px;
          color: #FFFFFF;
        }

        /* Credo Final */
        .credo-tome-box {
          background: linear-gradient(135deg, #0F182E 0%, #080D1A 100%);
          border-radius: 24px;
          padding: 4rem 2rem;
          color: #FFFFFF;
          text-align: center;
          border: 2px solid #2F4374;
          box-shadow: 
            0 30px 70px -15px rgba(0, 0, 0, 0.9),
            inset 0 0 60px rgba(0, 0, 0, 0.8);
          max-width: 1100px;
          margin: 2rem auto;
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

        /* Deslizamiento horizontal */
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

        @media (max-width: 768px) {
          .grimoire-stage {
            flex-direction: column;
            min-height: auto;
          }
          .grimoire-half-left, .grimoire-half-right {
            width: 100%;
            padding: 2rem 1.5rem;
            border-radius: 16px;
          }
          .grimoire-spine {
            display: none;
          }
          .grimoire-turning-leaf {
            display: none;
          }
        }
      `}} />

      <div className={`burnt-notebook-root ${poppins.variable} ${inter.variable}`}>
        {/* Cenizas de cuaderno quemado flotando en el ambiente */}
        <div className="ash-particle" style={{ left: "12%", top: "20%", animation: "subtleDriftAsh 7s linear infinite 0s" }} />
        <div className="ash-particle" style={{ left: "85%", top: "35%", animation: "subtleDriftAsh 9s linear infinite 2s" }} />
        <div className="ash-particle" style={{ left: "48%", top: "65%", animation: "subtleDriftAsh 8s linear infinite 4s" }} />

        {/* HERO SECTION: Inicio del Manuscrito */}
        <section className="hero-cult-altar" id="hero-seccion">
          <h1 className="cult-title">
            No Vendemos Entradas.{" "}
            <span className="sacred-glow-text">Consagramos Almas en el Escenario.</span>
          </h1>

          <p className="cult-subtitle">
            El Monolito profano ha caído. De sus cenizas se alzó TicketU: el cuaderno litúrgico que custodia el acceso sagrado a cada concierto, festival y congregación masiva. Sin filas, sin reventa y sin falsos profetas.
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

          {/* Estadísticas de la Liturgia */}
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

        {/* EL LIBRO DE LAS CRÓNICAS: Cambia de página fluidamente entre los capítulos del culto */}
        <section className="grimoire-viewport" id="libro-seccion">
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#818CF8", letterSpacing: "2px", textTransform: "uppercase" }}>
              Manuscrito Sagrado del Culto
            </span>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: "900", color: "#FFFFFF", margin: "0.25rem 0" }}>
              Las Crónicas del Servidor Cero
            </h2>
          </div>

          <div className="grimoire-stage">
            {/* Lomo central de encuadernación */}
            <div className="grimoire-spine">
              <div className="spine-stitch" />
              <div className="spine-stitch" />
              <div className="spine-stitch" />
              <div className="spine-stitch" />
              <div className="spine-stitch" />
            </div>

            {/* Hoja 3D giratoria que se activa SOLO al voltear la página */}
            {isFlipping && <div className="grimoire-turning-leaf" />}

            {/* Página Izquierda: Título y Relato Histórico del Folio Activo */}
            <div className="grimoire-half-left">
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#818CF8", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                    TOMO TICKET-U // FOLIO {folioActual.folioNumero} DE 4
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#F59E0B", letterSpacing: "1px", textTransform: "uppercase" }}>
                    AÑO {folioActual.epoca}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.55rem", fontWeight: "900", color: "#FFFFFF", margin: "0 0 0.5rem 0", lineHeight: 1.25 }}>
                  {folioActual.titulo}
                </h3>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#A5B4FC", marginBottom: "1rem", fontStyle: "italic" }}>
                  {folioActual.subtitulo}
                </div>

                <p style={{ fontSize: "14px", lineHeight: 1.75, color: "#CBD5E1", margin: 0 }}>
                  {folioActual.relato}
                </p>
              </div>
            </div>

            {/* Página Derecha: Dogma, Liturgia y Botón de Volteo */}
            <div className="grimoire-half-right">
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#F59E0B", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                  {folioActual.dogmaTitulo}
                </div>

                <div style={{ fontSize: "14.5px", fontStyle: "italic", color: "#F8FAFC", lineHeight: 1.65, marginBottom: "1.25rem", borderLeft: "2px solid #818CF8", paddingLeft: "12px" }}>
                  {folioActual.dogmaCita}
                </div>

                <p style={{ fontSize: "13.5px", color: "#94A3B8", lineHeight: 1.65, margin: "0 0 1.5rem 0" }}>
                  {folioActual.liturgia}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => cambiarFolio(currentFolio < 3 ? currentFolio + 1 : 0)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#2F4374",
                    border: "1px solid #4F6BFF",
                    color: "#FFFFFF",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(47, 67, 116, 0.4)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {folioActual.botonSiguiente}
                </button>
              </div>
            </div>
          </div>

          {/* Selector de los 4 Capítulos del Culto */}
          <div className="folio-tabs-bar">
            {capitulosCulto.map((cap, idx) => (
              <button
                key={cap.folioNumero}
                type="button"
                onClick={() => cambiarFolio(idx)}
                className={`folio-tab-button ${currentFolio === idx ? "active" : ""}`}
              >
                Folio {cap.folioNumero}: {cap.epoca}
              </button>
            ))}
          </div>
        </section>

        {/* SECCIÓN DE LOS 9 CÍRCULOS DEL CULTO */}
        <section className="burnt-section-wrapper" id="circulos-seccion">
          <div className="section-header-cult scroll-horizontal from-left">
            <span className="section-tag-cult">Panteón Distribuido</span>
            <h2 className="section-title-cult">Los Nueve Círculos Sagrados</h2>
            <p className="section-desc-cult">
              Cada círculo custodia un sacramento inquebrantable de la liturgia. Ingresa en ellos para dar testimonio y probar sus funciones.
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

        {/* CREDO FINAL DEL GATEWAY */}
        <section className="burnt-section-wrapper" id="credo-seccion">
          <div className="credo-tome-box scroll-horizontal from-right">
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#818CF8", letterSpacing: "2px", textTransform: "uppercase", display: "inline-block", marginBottom: "8px" }}>
              El Manifiesto Final
            </span>
            <h2 className="credo-title">El Credo Sagrado del Gateway</h2>
            <p className="credo-quote">
              &ldquo;Un solo punto de comunión divina. Nueve sacramentos independientes que jamás se contaminan entre sí. Ni la avalancha de mil peticiones simultáneas quebrantará la fe de los devotos de TicketU.&rdquo;
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/catalogo" className="btn-sacred-altar" style={{ border: "none" }}>
                Ver Congregaciones Disponibles
              </Link>
              <Link href="/auth" className="btn-initiation">
                Comulgar en la Red Sagrada
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
