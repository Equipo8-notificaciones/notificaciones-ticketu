# INTEGRACIONES — Microservicio Notificaciones

Versión revisada: 18-11-2026  
Módulo dueño de este archivo: `notificaciones/`.

Este documento declara las interfaces que Notificaciones implementa. Las rutas, exchanges y variables se configuran desde el backend y el archivo `.env`; no se deben copiar secretos a este documento.

## Integraciones declaradas

| ID | Tipo | Contraparte | Dirección | Contrato y evidencia |
|---|---|---|---|---|
| **I1 — Auth** | **A. Autenticación** | Auth | Notificaciones → Auth | `GET /internal/validar-sesion`; reenvía la cookie `jwt` sin modificar y la cabecera `x-api-key`. Evidencia: `backend/src/middleware/authMiddleware.js`, `backend/tests/auth/authMiddleware.test.js` y `backend/tests/auth/test_auth_integration.js`. |
| **I2 — API Gateway** | **B. API publicada a través del Gateway** | API Gateway TicketU / Frontend unificado | Cliente → Gateway → Notificaciones | `GET /api/notificaciones` y operaciones de notificaciones bajo `/api/notificaciones/*`. Gateway dirige `/api/notificaciones` a `NOTIFICACIONES_SERVICE_URL=http://notificaciones-service:3000`. Evidencia: `backend/src/routes/notificacionRoutes.js`, `backend/README.md` (sección API Gateway) y la prueba de extremo a extremo descrita en `INTEGRACION.md`. |
| **I3 — Panel Organizador** | **C. Broker de eventos** | Panel Organizador | Panel → RabbitMQ → Notificaciones | Exchange principal `ticketu.events`, exchange adicional `panel.evento.notificaciones.v1`, ambos tipo `topic`, routing key `panel.evento.notificaciones.v1`. El tipo de evento llega en la propiedad AMQP `type`; el cuerpo es JSON plano. Evidencia: `backend/src/broker/suscripciones.js`, `backend/src/broker/rabbitmqBroker.js`, `backend/src/events/panelEventoHandler.js`, `backend/tests/broker/suscripciones.test.js` y `backend/tests/panel/test_panel_evento_rabbitmq.js`. |

## Contratos adicionales consumidos por Notificaciones

| Proveedor | Exchange | Routing key | Propósito |
|---|---|---|---|
| Entradas | `entradas.events` | `entradas_emitidas` | Registrar al comprador y sus entradas activas; emitir la notificación/ticket de compra y confirmar el procesamiento mediante `notificaciones.events`. |
| Auth | `auth.events` | `recuperacion_cuenta`, `cuenta_staff` | Procesar correos de recuperación y creación/invitación de cuentas de staff. |

Las colas de Notificaciones son propias y durables. No se comparte una misma cola consumidora entre Notificaciones y otros microservicios.

## Formato de Panel soportado

- Exchanges: `ticketu.events` y `panel.evento.notificaciones.v1`.
- Tipo de exchange: `topic`.
- Routing key: `panel.evento.notificaciones.v1`.
- Cola durable del consumidor: `notificaciones.panel_eventos.v1`.
- Propiedad AMQP `type`: `evento_actualizado` o `evento_reprogramado`.
- Cuerpo: JSON plano con `id_evento`, `id_usuario`, `nuevo_estado`; para reprogramación también `fecha_cambio` y `hora_cambio`.
- El mismo mensaje puede llegar por ambos exchanges. Notificaciones usa `messageId` para evitar procesarlo dos veces.

La suscripción admite el cuerpo plano del contrato vigente y, por compatibilidad, el sobre `{ envelope, payload }` si el proveedor lo activa de forma coordinada.

## Auth

Notificaciones no interpreta ni firma el JWT. Reenvía la cookie `jwt` original a `AUTH_SERVICE_URL + /internal/validar-sesion` y agrega `x-api-key` con la clave compartida del entorno. Una sesión no válida se rechaza; si falta la configuración interna o Auth no está disponible, Notificaciones responde con error de servicio y no acepta la sesión.

## Catálogo

Catálogo forma parte del ecosistema que se levanta para la demostración integral de TicketU. Sin embargo, el backend actual de Notificaciones no realiza una llamada REST directa a Catálogo ni consume un evento publicado por Catálogo. Por lo tanto, este documento no declara una integración directa Notificaciones–Catálogo que el código no implementa.

## Configuración relevante

Variables del archivo `notificaciones/.env` (sin valores secretos en este documento):

- `DATABASE_URL`, `DB_SSL`.
- `AUTH_SERVICE_URL`, `AUTH_INTERNAL_API_KEY`, `AUTH_TIMEOUT_MS`.
- `BROKER_URL_DOCKER` o `BROKER_URL` según el entorno.
- `PANEL_EVENT_EXCHANGES`, `PANEL_EVENT_ROUTING_KEY`, `PANEL_EVENT_QUEUE`.
- Variables `SMTP_*` si se requiere entrega real de correo.

## Ejecución y pruebas

- Instrucciones para levantar Auth, Entradas, Notificaciones, Catálogo, Panel, Gateway y frontend: `INTEGRACION.md`.
- Instalación resumida: `INSTALACION.md`.
- Pruebas automatizadas: `cd backend && npm test`.
- Pruebas reales con Auth: `cd backend && npm run test:integration:auth` (requiere servicios y base de datos activos).
- Prueba de consumidor Panel: `cd backend && npm run test:integration:panel` (publica mensajes sintéticos; no sustituye la prueba que dispara un cambio desde Panel real).
