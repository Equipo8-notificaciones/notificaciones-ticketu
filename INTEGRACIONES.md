# Integraciones
| Integración | Tipo | Módulo contraparte | Servicio, endpoint o tópico | Contrato (ruta en el repo) | Ítem en GitHub |
|---|---|---|---|---|---|
| I1 | A. Servicio ofrecido | Auth → Notificaciones | GET /api/auth/validar-sesion | main/Documentación/Contratos/Contrato-Auth-Autentificacion.md | INT-01 |
| I2 — API Gateway | B. Servicio ofrecido | Notificaciones → Frontend unificado | `POST /api/notificaciones/:id/leida`, `POST /api/notificaciones/marcar-todas-leidas` y `DELETE /api/notificaciones/:id` mediante el API Gateway | `notificaciones/backend/src/routes/notificacionRoutes.js` | — |
| I3 — Broker | C. Mensajería | Entradas → Notificaciones | Consume `entradas.events/entradas_emitidas` y publica `notificaciones.events/notificaciones.confirmacion_envio`. El aviso de compra aparece en la app. | `notificaciones/backend/tests/integracion/entradas/README.md` | INT-02 |

# Otras integraciones

# Integraciones de Notificaciones · TicketU

## **Otras integraciones**

| Integración | Tipo | Módulo contraparte | Servicio, endpoint o tópico | Contrato (ruta en el repo) | Ítem en GitHub |
|---|---|---|---|---|---|
| I2 | B. Servicio ofrecido | Notificaciones → Frontend unificado | `GET http://localhost:8080/api/notificaciones/eventos` mediante el API Gateway | `notificaciones/backend/src/routes/notificacionRoutes.js` | — |
| I1 — Autenticación | A. Servicio consumido | Auth → Frontend unificado | `POST /api/auth/login` emite la cookie `jwt`. Notificaciones valida la sesión y autoriza el acceso a los avisos por usuario. Los permisos por rol están pendientes en Notificaciones. | `auth/backend/docs/swagger.yaml`, `notificaciones/backend/src/middleware/authMiddleware.js` | INT-01 |
| I3 — Broker | C. Mensajería | Auth ↔ Notificaciones | Consume `auth.events/recuperacion_cuenta` y `auth.events/cuenta_staff`. Publica el resultado del correo en `notificaciones.events/correo_auth`. | `notificaciones/backend/tests/integracion/auth/README.md` | INT-03 |
| I3 — Broker | C. Mensajería | Panel Organizador → Notificaciones | Consume `panel.evento.notificaciones.v1/evento_actualizado` y `panel.evento.notificaciones.v1/evento_reprogramado`los datos son mostrados en el front de compradores y organizador. | `notificaciones/backend/src/broker/suscripciones.js` | INT-04 |
