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


# Notificaciones

**Cuenta local de prueba** · `notificaciones.qa@example.invalid` / `TicketU-Revision-2026!`. Si aún no existe, regístrala en Auth como **Comprador QA Notificaciones** con el RUT de prueba `80.000.000-9`.

Para las pruebas de correo, usa una cuenta de prueba registrada con un correo cuyo buzón puedas abrir. Las pruebas por correo requieren que Notificaciones tenga SMTP configurado.

## Integraciones evaluadas

### 1. Mostrar una notificación de compra de entrada

1. Inicia sesión en **Auth** con la cuenta de prueba.
2. En **Catálogo**, abre un evento gratuito con cupos, pulsa **Adquirir Entradas** y emite una entrada. Verifica que aparezca el ticket.
3. Con la misma sesión, pulsa el icono de **Notificaciones** y busca el aviso de compra.

**Resultado esperado** · El centro muestra un aviso de compra que corresponde al evento del ticket. El inicio de sesión y la adquisición de la entrada preparan el escenario para comprobar ese aviso.

### 2. Recibir el correo de confirmación en Gmail (`entradas_emitidas`)

1. Completa la prueba 1 con una cuenta cuyo correo registrado puedas consultar.
2. Abre ese mismo buzón en Gmail y busca el correo de confirmación de la entrada.

**Resultado esperado** · El correo confirma la adquisición e identifica el evento. Si falla el envío, Notificaciones realiza hasta tres intentos en total.

### 3. Eliminar una o varias notificaciones

**Precondición** · La cuenta tiene al menos una notificación. Si hace falta, completa la prueba 1.

1. Pulsa el icono de **Notificaciones**.
2. Mantén pulsado un aviso durante un segundo para activar el modo de selección. Selecciona los avisos que quieras eliminar y confirma la acción.
3. Recarga la página y revisa el centro de avisos.

**Resultado esperado** · Los avisos seleccionados desaparecen y siguen fuera del listado después de recargar.

### 4. Marcar una notificación como leída

**Precondición** Usa una cuenta con al menos un aviso sin leer.

1. Pulsa el icono de **Notificaciones** y anota el número de avisos sin leer.
2. Haz clic una vez en un aviso sin leer.
3. Recarga la página y revisa ese mismo aviso.

**Resultado esperado** · El aviso sigue visible y marcado como leído. El contador de avisos sin leer disminuye en uno si no llegaron avisos nuevos durante la prueba.

### 5. Marcar varias notificaciones como leídas

**Precondición** Usa una cuenta con al menos dos avisos sin leer.

1. Pulsa el icono de **Notificaciones** y comprueba que haya varios avisos sin leer.
2. Pulsa **Marcar todas como leídas**.
3. Recarga la página y revisa el contador y los avisos.

**Resultado esperado** · Los avisos siguen en el listado y el contador queda en cero si no llegaron avisos nuevos. El cambio se conserva después de recargar.

## Integraciones no evaluadas

### 6. Ver el recordatorio de un evento

1. Completa la prueba 1 con un evento que todavía no haya empezado y que no esté cancelado.
2. Si faltan más de 24 horas, revisa **Notificaciones** cuando falten 24 horas para el evento. Si compras dentro de las últimas 24 horas, revisa el centro después de que Notificaciones procese la compra.

**Resultado esperado** · Aparece un recordatorio en la app con el nombre, la fecha y la hora del evento. Si falla su envío a la app, Notificaciones registra hasta tres intentos. Los recordatorios programados requieren que el backend permanezca en ejecución.

### 7. Recuperar una contraseña (`recuperacion_cuenta`)

**Precondición** Usa una cuenta de comprador registrada con un buzón accesible de correo.

1. En **Auth**, pulsa **¿Olvidaste tu contraseña?** e ingresa el correo de la cuenta de prueba.
2. Abre el correo de restablecimiento, sigue el enlace y define una nueva contraseña.

**Resultado esperado** · Auth publica `recuperacion_cuenta`. Notificaciones envía el enlace y devuelve a Auth el resultado del envío mediante `correo_auth`. El comprador puede iniciar sesión con su nueva contraseña.

### 8. Recibir la invitación de una cuenta Staff (`cuenta_staff`)

1. Auth debe enviar datos mediante rabbitMQ.
2. Abre el correo de invitación recibido y usa el enlace para establecer la contraseña inicial.

**Resultado esperado** · Auth publica `cuenta_staff`. Notificaciones envía la invitación y comunica el resultado mediante `correo_auth`. La cuenta Staff puede completar su primer inicio de sesión. [Flujo de alta de Staff de prueba](notificaciones/backend/tests/integracion/auth/README.md#b-rabbitmq-staff)

### 9. Ver el aviso de cancelación de un evento (`evento_actualizado`)

**Precondición** Usuario organizador y comprador existen. Usuario comprador tiene entrada para el evento cancelado.

1. Panel nos envía datos por rabbitMQ.
2. Inicia sesión como el comprador y abre **Notificaciones** para comprobrar la cancelación.
3. Inicia sesión como el organizador y abre **Notificaciones**. para comprobar que recibió el resumen de la operación.

**Resultado esperado** · El comprador recibe un aviso de cancelación. El organizador recibe un resumen con el número de usuarios notificados y pendientes.

### 10. Ver el aviso de reprogramación de un evento (`evento_reprogramado`)

**Precondición** Usuario organizador y comprador existen. Usuario comprador tiene entrada para el evento cambiado.

1. Panel nos envía datos por rabbitMQ.
2. Inicia sesión como el comprador y abre **Notificaciones** para comprobrar la reprogramación.
3. Inicia sesión como el organizador y abre **Notificaciones**. para comprobar que recibió el resumen de la operación.

**Resultado esperado** · El comprador recibe el aviso con los nuevos datos del evento y el organizador recibe un resumen del envío. Notificaciones reprograma el recordatorio con la nueva fecha.

docker compose --env-file .env --profile test run --rm test-panel-evento
```

Esta última prueba publica mensajes de prueba para validar el consumidor. Para certificar que el evento real lo emitió Panel, ejecutar las operaciones PATCH/DELETE descritas en `INTEGRACION.md`, sección 12, y guardar logs del Panel, RabbitMQ y Notificaciones.
