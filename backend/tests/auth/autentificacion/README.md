# Integración real Auth ↔ Notificaciones

Este test no levanta una base de datos local ni inicia servicios con configuración artificial. Verifica los servicios que ya están ejecutándose y que Notificaciones utiliza la conexión Supabase configurada.

## Requisitos

- Auth activo en `http://localhost:10000`.
- Notificaciones activo en `http://localhost:3001`.
- Supabase configurado en `.env` y `GET /ready` respondiendo HTTP 200.
- Dependencias del backend instaladas (`npm ci`).

## Ejecutar

Desde la carpeta `backend/`:

```bash
node tests/auth/test_auth_integration.js
```

La prueba registra un usuario temporal mediante Auth, inicia sesión, verifica la cookie `jwt_token`, comprueba que Notificaciones rechaza una sesión ausente y una inválida, y finalmente confirma que Notificaciones acepta la cookie válida y consulta el centro del usuario.

Si los servicios usan otras URL, configura `AUTH_SERVICE_URL` y `NOTIFICACIONES_URL`. No se modifica ni inicia el frontend.
