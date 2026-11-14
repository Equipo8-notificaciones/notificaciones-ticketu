# Pruebas de Notificaciones

Las pruebas unitarias se ejecutan desde `backend/` con:

```bash
npm test
```

Las pruebas de integración usan Auth, RabbitMQ y Supabase reales. Revisa `backend/README.md`, sección **Pruebas de integración**, para configurar el entorno y ejecutar:

- `npm run test:integration:auth`
- `docker compose --profile test run --rm test-compra-entrada`
- `docker compose --profile test run --rm test-panel-evento`

Las pruebas de compra y Panel escriben datos de prueba en Supabase con identificadores únicos. No apuntes las pruebas a una base de producción con datos de usuarios reales.
