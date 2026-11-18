# Decisiones de Diseño: Header y Footer

Documento de registro de cambios aplicados sobre los componentes globales de navegación para hacerlos interactivos y funcionales entre todos los módulos del proyecto.

---

## 1. Header (`Header.tsx` y componentes asociados)

- **Navegación Interactiva (SPA):** Se reemplazaron los `<span>` estáticos por componentes `<Link>` de Next.js, evitando recargas completas de página.
- **Rutas Integradas:**
  - `Inicio` → `/`
  - `Catálogo` → `/catalogo`
  - `Entradas` → `/entradas`
  - `Organizador` → `/organizador`
  - `Promociones` → `/promociones`
  - `Check-in` → `/checkin`
  - `Pagos` → `/pagos`
  - `Mi cuenta` → `/auth`
- **Detección de Ruta Activa:** Implementación de `usePathname()` para aplicar la clase `.active` y resaltar visualmente la sección en la que se encuentra el usuario.
- **Logo Vectorial de Ticket (`logo.tsx`):** Se rediseñó el icono con un trazado SVG profesional de un ticket de evento (muescas laterales redondeadas, línea punteada de perforación/talón y sello circular de autenticidad), enlazado directamente a la raíz (`/`) y unificado tanto en el Header como en el Footer.
- **Botón de Búsqueda (`boton_busqueda.tsx`):** Conectado directamente a `/catalogo` usando `<Link>`.
- **Avatar de Usuario (`MC`):** Enlace directo a `/auth` para gestión de cuenta e inicio de sesión.
- **Soporte Responsivo:** Menú horizontal deslizable (`mobile-scroll-container`) para navegación fluida en dispositivos móviles y pantallas estrechas.

---

## 2. Footer (`Footer.tsx`)

- **Estructuración en Columnas Funcionales:** Se reorganizó el pie de página en 4 columnas temáticas con botones/enlaces de acceso directo:
  - **TicketU:** Identidad y enlace a la página principal (`/`).
  - **Explorar & Entradas:** Enlaces a `/catalogo`, `/entradas`, `/promociones` y `/entradas/confirmacion`.
  - **Gestión & Operaciones:** Enlaces a `/organizador`, `/checkin`, `/pagos` y `/notificaciones`.
  - **Mi Cuenta & Soporte:** Acceso a `/auth`, además de modales interactivos.
- **Modales de Asistencia y Términos:**
  - *Centro de Ayuda:* Diálogo con resumen de funcionalidades por módulo y contacto de soporte.
  - *Términos de Servicio:* Diálogo informativo sobre el alcance académico y entorno de pruebas del sistema.
  - *Motivo:* Permite que ambos botones sean 100% funcionales sin requerir rutas o backend adicional.
- **Botón "Subir arriba":** Desplazamiento suave (`smooth scroll`) al inicio de la página.

---

## 3. Ajustes Adicionales

- **`.gitignore`:** Inclusión de `frontend/` para prevenir el seguimiento de subcarpetas o copias duplicadas.
- **Home (`page.tsx`):** Grilla de tarjetas de acceso rápido a los módulos para facilitar la navegación y pruebas en entorno local y docker.
