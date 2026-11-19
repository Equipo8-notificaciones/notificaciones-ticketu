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
npm run test:auth-integration
```

La prueba registra dos usuarios de prueba mediante Auth (quedan registrados en su base de datos), inicia sesión y verifica la cookie `jwt`. Comprueba que Notificaciones rechaza sesiones ausentes e inválidas, valida ambas sesiones directamente contra Auth, y confirma que cada sesión puede consultar únicamente sus propias notificaciones en Supabase.

Si los servicios usan otras URL, configura `AUTH_SERVICE_URL` y `NOTIFICACIONES_URL`. No se modifica ni inicia el frontend.
