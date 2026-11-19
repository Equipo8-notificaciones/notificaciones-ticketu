# INTEGRACIONES — Microservicio Notificaciones

Versión revisada: 18-11-2026  
Módulo dueño de este archivo: `notificaciones/`.

Este documento declara las interfaces que Notificaciones implementa. Las rutas, exchanges y variables se configuran desde el backend y el archivo `.env`; no se deben copiar secretos a este documento.

## Integraciones declaradas

| Integración | Tipo | Módulo contraparte | Servicio, endpoint o tópico | Contrato (ruta en el repo) | Ítem en GitHub |
|---|---|---|---|---|---|
| I1 | A. Servicio ofrecido | Auth → Notificaciones | GET /api/auth/validar-sesion | main/Documentación/Contratos/Contrato-Auth-Autentificacion.md | INT-01 |
| I2 | B. Servicio ofrecido | Notificaciones → Frontend unificado | `POST /api/notificaciones/:id/leida`, `POST /api/notificaciones/marcar-todas-leidas` y `DELETE /api/notificaciones/:id` mediante el API Gateway | `notificaciones/backend/src/routes/notificacionRoutes.js` | — |
| I3 | C. Mensajería | Entradas → Notificaciones | Consume `entradas.events/entradas_emitidas` y publica `notificaciones.events/notificaciones.confirmacion_envio`. El aviso de compra aparece en la app. | `notificaciones/backend/tests/integracion/entradas/README.md` | INT-02 |

## **Otras integraciones**

| Integración | Tipo | Módulo contraparte | Servicio, endpoint o tópico | Contrato (ruta en el repo) | Ítem en GitHub |
|---|---|---|---|---|---|
| R2 | B. Servicio ofrecido | Notificaciones → Frontend unificado | `GET http://localhost:8080/api/notificaciones/eventos` mediante el API Gateway | `notificaciones/backend/src/routes/notificacionRoutes.js` | — |
| R1 | A. Servicio consumido | Auth → Frontend unificado | `POST /api/auth/login` emite la cookie `jwt`. Notificaciones valida la sesión y autoriza el acceso a los avisos por usuario. Los permisos por rol están pendientes en Notificaciones. | `auth/backend/docs/swagger.yaml`, `notificaciones/backend/src/middleware/authMiddleware.js` | INT-01 |
| R3 | C. Mensajería | Auth ↔ Notificaciones | Consume `auth.events/recuperacion_cuenta` y `auth.events/cuenta_staff`. Publica el resultado del correo en `notificaciones.events/correo_auth`. | `notificaciones/backend/tests/integracion/auth/README.md` | INT-03 |
| R3 | C. Mensajería | Panel Organizador → Notificaciones | Consume `panel.evento.notificaciones.v1/evento_actualizado` y `panel.evento.notificaciones.v1/evento_reprogramado`los datos son mostrados en el front de compradores y organizador. | `notificaciones/backend/src/broker/suscripciones.js` | INT-04 |

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
