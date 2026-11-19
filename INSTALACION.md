# Instalación y ejecución — Notificaciones en TicketU

Esta guía aplica al proyecto incluido en el ZIP. Los comandos de integración completos para Windows PowerShell están en `INTEGRACION.md`.

## Requisitos

- Windows 10/11, Docker Desktop con Linux containers y Docker Compose v2.
- Node.js/npm solo si se ejecuta o prueba Notificaciones fuera de Docker.
- Acceso a la red y a los repositorios/imágenes necesarios para construir los servicios.
- Una sola red Docker externa `plataforma-eventos-net`.
- Un solo RabbitMQ compartido, vhost `ticketu` (no iniciar un broker por microservicio).

## Orden de inicio

Desde la raíz del repositorio, donde existen `auth`, `catalogo`, `entradas`, `notificaciones`, `panel` y `FrontendTitec-main`:

1. Crear la red `plataforma-eventos-net` si aún no existe.
2. Preparar `auth/backend/.env`, las claves RSA y levantar PostgreSQL, Keycloak y RabbitMQ de Auth.
3. Inicializar el esquema de Auth con Prisma y levantar `auth-service`.
4. (Opcional, solo QA local) crear las cuentas de prueba de Auth desde su perfil `qa-seed`; ver `auth/backend/README.md`. Las cuentas de organizador deben coincidir con el propietario del evento que se vaya a probar.
5. Levantar MongoDB y `entradas-service`.
6. Configurar `notificaciones/.env`, ejecutar `backend/supabase/schema.sql` en la base indicada por `DATABASE_URL` y levantar Notificaciones.
7. Levantar Catálogo y sincronizar los eventos que se utilizarán en el frontend.
8. Levantar Panel con `panel/docker-compose.integracion.yml`, apuntándolo al Auth, Entradas y RabbitMQ compartidos.
9. Levantar el API Gateway oficial con las rutas `AUTH_SERVICE_URL`, `CATALOGO_SERVICE_URL`, `ENTRADAS_SERVICE_URL`, `ORGANIZADOR_SERVICE_URL` y `NOTIFICACIONES_SERVICE_URL`.
10. Levantar `FrontendTitec-main`.

No ejecutar `docker compose down -v` ni crear un segundo RabbitMQ: esos comandos pueden borrar bases/volúmenes o generar dos brokers aislados.

## Variables de integración de Notificaciones

Configurar en `notificaciones/.env`:

```dotenv
DATABASE_URL=postgresql://<usuario>:<clave>@<host>:5432/<base>
DB_SSL=false
AUTH_SERVICE_URL=http://auth-service:10000
AUTH_INTERNAL_API_KEY=<mismo valor que INTERNAL_API_KEY de auth/backend/.env>
AUTH_TIMEOUT_MS=5000
BROKER_URL_DOCKER=amqp://ticketu:ticketu_dev@ticketu-rabbitmq:5672/ticketu
PANEL_EVENT_EXCHANGES=ticketu.events,panel.evento.notificaciones.v1
PANEL_EVENT_ROUTING_KEY=panel.evento.notificaciones.v1
PANEL_EVENT_QUEUE=notificaciones.panel_eventos.v1
FRONTEND_ORIGIN=http://localhost:3000
```

`DB_SSL=false` corresponde a PostgreSQL local dentro de Docker. Para Supabase, utiliza la URL entregada por el proyecto y configura SSL de acuerdo con esa instancia. Nunca agregues la clave de Auth al frontend ni la publiques en capturas.

## Puertos principales

| Servicio | Puerto host |
|---|---:|
| Auth API | 10000 |
| PostgreSQL Auth | 5433 |
| Keycloak | 8081 |
| RabbitMQ AMQP / administración | 5672 / 15672 |
| Entradas API | 3003 |
| Catálogo API de integración | 4000 |
| Notificaciones API | 3001 |
| API Gateway | 8080 |
| Frontend unificado | 3000 |
| Panel API | interno `organizador-service:3000`, vía Gateway |

Los puertos corresponden a los Compose/guía incluidos; si ya tienes servicios corriendo, confirma sus puertos antes de iniciar otros contenedores.

## Comprobaciones de Notificaciones

```powershell
Invoke-RestMethod 'http://localhost:3001/health'
Invoke-RestMethod 'http://localhost:3001/ready'
docker exec ticketu-rabbitmq rabbitmqctl list_queues -p ticketu name consumers messages_ready
```

La cola de Panel debe aparecer como `notificaciones.panel_eventos.v1` con un consumidor. La disponibilidad HTTP `/ready` verifica la base de datos; la cola se verifica con RabbitMQ.

## Pruebas

Pruebas unitarias de Notificaciones:

```powershell
Set-Location notificaciones/backend
npm ci
npm test
```

Prueba del consumidor Panel contra RabbitMQ y la base configurada:

```powershell
Set-Location ..
docker compose --env-file .env --profile test run --rm test-panel-evento
```

Esta última prueba publica mensajes de prueba para validar el consumidor. Para certificar que el evento real lo emitió Panel, ejecutar las operaciones PATCH/DELETE descritas en `INTEGRACION.md`, sección 12, y guardar logs del Panel, RabbitMQ y Notificaciones.
