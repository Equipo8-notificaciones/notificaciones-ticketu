# TicketU — Notificaciones, RabbitMQ y Docker

Este proyecto contiene el frontend, el backend de Notificaciones y RabbitMQ. La carpeta `backend/tests` incorpora una prueba que simula el evento de compra que Entradas debe enviar. El ZIP de Entradas se utiliza solo como referencia: no se modifica ni se copia a este proyecto.

## Requisitos y configuración

- Docker Desktop con Docker Compose.
- Copia `.env.example` a `.env` en la raíz. Los valores RabbitMQ predeterminados (`ticketu` / `ticketu_dev`) son únicamente para desarrollo local.
- Para probar sin persistencia externa, deja `DATABASE_URL` vacío; el backend usa su repositorio en memoria. Para guardar datos en Supabase, completa una URL válida y aplica `backend/supabase/schema.sql`.
- Para probar el envío de correo real, configura `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`. Con SMTP vacío, la notificación APP puede crearse, pero el envío EMAIL se marcará con error.

## Iniciar la aplicación

Desde la raíz del proyecto, donde está `docker-compose.yml`:

```bash
docker compose up --build -d
```

Servicios locales:

- Frontend: <http://localhost:3000>
- Backend de Notificaciones: <http://localhost:3001>
- Documentación API: <http://localhost:3001/api-docs>
- Salud del backend: <http://localhost:3001/health>
- Consola de RabbitMQ: <http://localhost:15672>

Ver logs del consumidor:

```bash
docker compose logs -f notificaciones
```

## Ejecutar la prueba de compra simulada

Con la aplicación arriba, ejecuta:

```bash
docker compose --profile test run --build --rm test-compra-entrada
```

El servicio de prueba se ejecuta solo al pedir el perfil `test`; no se inicia con el `docker compose up` habitual. Publica un JSON como el que utiliza Entradas en el exchange `entradas.events` con routing key `entradas_emitidas`, espera la confirmación publicada por Notificaciones en `notificaciones.confirmacion_envio` y valida que se haya creado una notificación APP para el ID de usuario de prueba. Sus instrucciones están en `backend/tests/README.md`.

## Contrato simulado

```json
{
  "correo_comprador": "comprador.prueba@example.com",
  "nombre_comprador": "Comprador de Prueba",
  "id_usuario": "usr-test-notificaciones",
  "nombre_evento": "Concierto de Prueba TicketU",
  "id_evento": "evt-test-notificaciones",
  "fecha_evento": "2026-11-20",
  "hora_evento": "20:30",
  "qr_data": "https://storage.midominio.com/qr/test.png"
}
```

## Límite entre los dos proyectos

En el ZIP de referencia, `back-end/services/notificaciones_service.py` construye y muestra el JSON por consola, pero no abre una conexión a RabbitMQ. La prueba añadida aquí simula solo el lado publicador para verificar la conexión real con el consumidor de Notificaciones. No invoca la API de compra de Entradas ni altera ese repositorio. Para integración de extremo a extremo, el equipo de Entradas debe publicar el mensaje real en RabbitMQ al emitir una entrada.

## Detener los contenedores

```bash
docker compose down
```

Para borrar también los mensajes persistidos en el volumen de RabbitMQ (no se recomienda si necesitas conservar las colas):

```bash
docker compose down -v
```
