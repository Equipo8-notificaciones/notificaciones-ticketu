# Pruebas de Notificaciones

Las pruebas unitarias se ejecutan desde `backend/` con:

```bash
npm test
```

Las pruebas de integración usan Auth, RabbitMQ y Supabase reales. Revisa `backend/README.md`, sección **Pruebas de integración**, para configurar el entorno y ejecutar:

- `npm run test:integration:auth`
- `npm run test:integration:auth-rabbitmq`
- `docker compose --profile test run --rm test-compra-entrada`
- `docker compose --profile test run --rm test-panel-evento`

La prueba Auth ↔ Notificaciones usa una cuenta Staff de prueba y sus requisitos están en [`integracion/auth/README.md`](integracion/auth/README.md).

Las pruebas de compra y Panel escriben datos de prueba en Supabase con identificadores únicos. No apuntes las pruebas a una base de producción con datos de usuarios reales.

La prueba RabbitMQ de Entradas y su alcance están documentados en [`integracion/entradas/README.md`](integracion/entradas/README.md). No requiere acceso a MongoDB.
