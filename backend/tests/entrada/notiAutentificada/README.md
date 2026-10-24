# Prueba de integración: compra desde Entradas

Este test de integración está ubicado junto a las pruebas de Entradas. Simula el evento que el microservicio Entradas debe publicar tras emitir una entrada. Publica el contrato v3 en RabbitMQ y valida que Notificaciones responda y cree una notificación APP para el usuario de prueba.

- Exchange de entrada: `entradas.events`
- Routing key de entrada: `entradas_emitidas`
- Exchange de confirmación: `notificaciones.event`
- Routing key de confirmación: `notificaciones.confirmacion_envio`
- La confirmación incluye `id_usuario`, `id_evento` y `estado` (`en_cola` al recibir el evento; `programado` cuando se agenda el recordatorio).
- La prueba genera identificadores únicos y utiliza una cola temporal de confirmación.

## Ejecutar con Docker

Desde la raíz del proyecto Notificaciones:

```bash
docker compose up --build -d
docker compose --profile test run --build --rm test-compra-entrada
```

Revisar también el procesamiento del consumidor:

```bash
docker compose logs -f notificaciones
```

La prueba no necesita que el correo real esté configurado: si SMTP está apagado, debe validar igualmente la recepción del evento y la creación de la notificación APP, pero indicará que un canal de envío falló. Si `DATABASE_URL` está configurada, debe apuntar a una base compatible con `backend/supabase/schema.sql`; si queda vacía, el backend utiliza su repositorio en memoria.

**Límite de la simulación:** el `services/notificaciones_service.py` que venía en el ZIP de Entradas solo imprime el JSON; no crea una conexión AMQP real. Por eso este test publica directamente el mismo contrato desde el proyecto Notificaciones sin modificar el proyecto Entradas.
