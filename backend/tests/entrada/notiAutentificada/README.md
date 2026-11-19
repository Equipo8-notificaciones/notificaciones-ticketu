# Integración Entradas → Notificaciones

Con RabbitMQ, Notificaciones y Supabase levantados:

```bash
docker compose --profile test run --rm test-compra-entrada
```

La prueba publica el contrato `entradas_emitidas` y valida la confirmación `en_cola`, la fila en `entradas_usuario`, las notificaciones APP/EMAIL y los registros de `envios_notificacion`. Configura `TEST_EMAIL_DESTINO` si quieres utilizar un buzón controlado para el envío SMTP.
