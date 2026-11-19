# Integración RabbitMQ y Supabase de Notificaciones

La configuración de base de datos y las pruebas integrales actualizadas están documentadas en `backend/README.md`. Antes de levantar el backend, configura `DATABASE_URL` en `.env` y ejecuta `backend/supabase/schema.sql` en la base elegida. Notificaciones valida sesiones de Auth mediante `GET /internal/validar-sesion`, reenviando la cookie `jwt` y `x-api-key`. Para Panel consume JSON plano y la propiedad AMQP `type`, con la routing key `panel.evento.notificaciones.v1`, desde `ticketu.events` y el exchange dedicado `panel.evento.notificaciones.v1`. La prueba de compra valida `entradas_usuario`, `notificacion` y `envios_notificacion`; la prueba de Panel valida destinatarios activos, confirmación al organizador y persistencia.


# Prueba local de integración TicketU

Esta guía levanta desde cero **Auth, Catálogo, Entradas y Notificaciones** con Docker Desktop en Windows. La prueba empieza con el registro de un comprador y termina cuando ese comprador ve en la app la notificación de una compra simulada.

El frontend usa el Gateway para llamar a los cuatro servicios. Auth guarda los compradores en PostgreSQL, Entradas guarda el inventario y los tickets en MongoDB y publica la compra en RabbitMQ. Notificaciones consume ese evento y guarda el aviso. Keycloak inicia como dependencia de Auth. La prueba usa el pago simulado de Entradas y termina con el ticket emitido. La validación del QR en puerta requiere Check-in.

## Consolas que vas a usar

| Consola | Uso |
| --- | --- |
| **PowerShell A** | Preparar y levantar todo. Ejecuta los pasos 1 a 8 aquí, en orden. Docker queda corriendo en segundo plano. |
| **PowerShell B (opcional)** | Mirar logs o consultar el stock mientras haces la prueba. Ábrela solo para el paso 10. |
| **Navegador** | Registrar al comprador, iniciar sesión, adquirir la entrada y comprobar el aviso en el paso 9. |

## 1. PowerShell A — abre el proyecto y crea la red

Abre Docker Desktop con contenedores Linux. En PowerShell, entra en la carpeta que contiene `auth`, `catalogo`, `entradas`, `notificaciones` y `FrontendTitec-main`. Si abriste la terminal en VS Code desde esa carpeta, ya puedes ejecutar el bloque. Ajusta la ruta si guardaste el proyecto en otra ubicación.

```powershell
Set-Location "$env:USERPROFILE\Downloads\notificaciones_ticketu"
Get-ChildItem -Directory | Select-Object -ExpandProperty Name

docker version
docker compose version

docker network inspect plataforma-eventos-net *> $null
if ($LASTEXITCODE -ne 0) {
    docker network create plataforma-eventos-net
}
```

En `docker version` deben aparecer el cliente y el servidor de Docker. Los contenedores usarán `plataforma-eventos-net` para encontrarse por nombre. Las primeras compilaciones descargan imágenes y dependencias, por lo que necesitan conexión a Internet.

Pega también esta función en **PowerShell A**. Los pasos siguientes la usan para esperar a que una API responda.

```powershell
function Esperar-Http {
    param([string]$Url)

    for ($i = 0; $i -lt 60; $i++) {
        curl.exe -fsS --max-time 3 $Url -o NUL 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Disponible $Url"
            return
        }
        Start-Sleep -Seconds 2
    }

    throw "El servicio no respondió en $Url"
}
```

## 2. PowerShell A — prepara la configuración de Auth

```powershell
if (-not (Test-Path -LiteralPath 'auth/backend/.env')) {
    Copy-Item -LiteralPath 'auth/backend/.env.example' -Destination 'auth/backend/.env'
}
notepad.exe auth/backend/.env
```

En `auth/backend/.env`, completa `KEYCLOAK_ADMIN_PASSWORD`, `KEYCLOAK_CLIENT_SECRET` e `INTERNAL_API_KEY` con valores de desarrollo. Auth y Entradas leerán de ese archivo la misma `INTERNAL_API_KEY`. Para los enlaces de recuperación del comprador, deja esta línea:

```dotenv
COMPRADOR_FRONTEND_URL=http://localhost:3000/auth
```

Guarda el archivo antes de continuar. Revisa si ya está presente el par de llaves RSA:

```powershell
Test-Path -LiteralPath 'auth/backend/private.pem'
Test-Path -LiteralPath 'auth/backend/public.pem'
```

Si las dos comprobaciones dan `True`, sigue al paso 3. Si las dos dan `False`, ejecuta el siguiente comando con Node.js 22 o superior. Si solo hay una llave, recupera la otra del mismo par antes de continuar.

```powershell
node auth/backend/tools/generar-llaves.mjs
```

## 3. PowerShell A — levanta PostgreSQL, Keycloak y RabbitMQ

```powershell
docker compose --env-file auth/backend/.env -f auth/backend/docker-compose.yml pull db keycloak rabbitmq
docker compose --env-file auth/backend/.env -f auth/backend/docker-compose.yml up -d db keycloak rabbitmq
```

Comprueba las tres dependencias:

```powershell
docker exec ticketu-db pg_isready -h 127.0.0.1 -U admin -d ticketu
Esperar-Http 'http://localhost:8081/realms/ticketu-realm/.well-known/openid-configuration'
docker exec ticketu-rabbitmq rabbitmqctl -t 90 await_startup
docker exec ticketu-rabbitmq rabbitmq-diagnostics -q check_port_connectivity
docker exec ticketu-rabbitmq rabbitmqctl list_queues -p ticketu name consumers
```

PostgreSQL debe indicar `accepting connections`. Si sigue arrancando, repite `pg_isready`. Keycloak debe tener listo el realm `ticketu-realm`. Antes de seguir, comprueba que aparezca `auth.correo_auth` en el listado de RabbitMQ. Si aún falta, vuelve a consultar las colas cuando termine el arranque. Usa un solo RabbitMQ para toda la prueba.

## 4. PowerShell A — inicializa Prisma y levanta Auth

En una instalación nueva, crea las tablas de Auth con Prisma:

```powershell
docker compose --env-file auth/backend/.env -f auth/backend/docker-compose.auth-service.yml --profile setup run --rm --build prisma-init
```

Si la base ya estaba inicializada, conserva las tablas y pasa directamente a levantar Auth.

```powershell
docker compose --env-file auth/backend/.env -f auth/backend/docker-compose.auth-service.yml up -d --build --wait auth-service
Esperar-Http 'http://localhost:10000/api/health'
```

Para crear las cuentas de demostración locales de Auth, después de iniciar Auth, Keycloak y PostgreSQL ejecuta el seed QA explícito. Restablece la contraseña de esas nueve cuentas QA a `TicketuQA2026!`; úsalo solo en tu base local de pruebas:

```powershell
$env:QA_SEED_ALLOW = 'SI'
docker compose --env-file auth/backend/.env -f auth/backend/docker-compose.auth-service.yml --profile qa run --rm --build qa-seed
Remove-Item Env:QA_SEED_ALLOW
```

Las cuentas `organizador1@ticketu.test` a `organizador3@ticketu.test` tienen rol `organizador`. Sin embargo, el UUID del usuario generado por Keycloak puede no coincidir con el UUID fijo que el seed de Panel asigna al propietario del evento. Compruébalo en la sección 12 antes de ejecutar cambios reales.

## 5. PowerShell A — levanta MongoDB y Entradas

```powershell
docker compose --env-file auth/backend/.env -f entradas/docker-compose.yml pull mongodb
docker compose --env-file auth/backend/.env -f entradas/docker-compose.yml up -d mongodb
docker exec ticketu_entradas_mongo mongosh --quiet --eval 'db.adminCommand({ping:1}).ok'
```

Cuando MongoDB responda `1`, levanta Entradas. La primera vez que se inicializa un volumen vacío, MongoDB carga los eventos que trae `entradas/database/init_db.js`.

```powershell
docker compose --env-file auth/backend/.env -f entradas/docker-compose.yml up -d --build --wait entradas-service
Esperar-Http 'http://localhost:3003/health'

Invoke-RestMethod 'http://localhost:3003/api/entradas/eventos/evt-004' |
    Select-Object id, titulo, fecha, hora, tipoEntrada, precio, stockDisponible
```

Debes ver **Fiesta Mechona Info 2026**, de tipo `PAGADA`, con precio `4500` y stock disponible. Si MongoDB está reutilizando un volumen de una instalación anterior, el inventario puede tener otros datos.

## 6. PowerShell A — prepara la base de Notificaciones y levanta el backend

Para reproducir la prueba sin depender de Supabase, crea una base separada en el PostgreSQL local del paso 3. Si ya usas un Supabase de prueba en `notificaciones/.env`, puedes conservar esa configuración y aplicar `notificaciones/backend/supabase/schema.sql` en ese Supabase si las tablas aún faltan. En ese caso, salta el bloque de creación de la base local y levanta Notificaciones al final de este paso.

```powershell
$baseExiste = docker exec ticketu-db psql -U admin -d ticketu -Atc "SELECT 1 FROM pg_database WHERE datname = 'notificaciones_integracion'"
if ($LASTEXITCODE -ne 0) {
    throw 'No se pudo consultar la base de Notificaciones'
}
if ($baseExiste -ne '1') {
    docker exec ticketu-db createdb -U admin notificaciones_integracion
}
Get-Content -Raw -Encoding UTF8 notificaciones/backend/supabase/schema.sql |
    docker exec -i ticketu-db psql -U admin -d notificaciones_integracion -v ON_ERROR_STOP=1
```

Si elegiste la base local, abre `notificaciones/.env`:

```powershell
if (-not (Test-Path -LiteralPath 'notificaciones/.env')) {
    Copy-Item -LiteralPath 'notificaciones/.env.example' -Destination 'notificaciones/.env'
}
notepad.exe notificaciones/.env
```

Con las credenciales de desarrollo definidas en el Compose de Auth, reemplaza o completa estas entradas. Mantén una sola línea por variable.

```dotenv
DATABASE_URL=postgresql://admin:adminpassword@ticketu-db:5432/notificaciones_integracion
DB_SSL=false
AUTH_SERVICE_URL=http://auth-service:10000
AUTH_INTERNAL_API_KEY=<mismo valor que INTERNAL_API_KEY de auth/backend/.env>
FRONTEND_ORIGIN=http://localhost:3000
```

Guarda el archivo. Para verificar el aviso de compra en la app basta con la base y RabbitMQ. Para verificar además el correo, usa una cuenta remitente SMTP válida y un buzón de destino que controles. Si usas Gmail con la configuración actual, consulta cómo generar la credencial del remitente. [Ayuda de Google sobre contraseñas de aplicación](https://support.google.com/accounts/answer/185833?hl=es)

```powershell
docker compose --env-file notificaciones/.env -f notificaciones/docker-compose.yml up -d --build --wait notificaciones
Esperar-Http 'http://localhost:3001/ready'

docker exec ticketu-rabbitmq rabbitmqctl list_queues -p ticketu name consumers
```

Las colas `entradas.pagos` y `notificaciones.entradas_emitidas` deben mostrar un consumidor cada una. Si RabbitMQ ya está disponible y alguna de esas colas sigue en cero, reinicia los dos servicios y verifica otra vez:

```powershell
docker restart entradas-service notificaciones-notificaciones-1
Esperar-Http 'http://localhost:3003/health'
Esperar-Http 'http://localhost:3001/ready'
docker exec ticketu-rabbitmq rabbitmqctl list_queues -p ticketu name consumers
```

## 7. PowerShell A — levanta Catálogo y carga el evento de prueba

Compila el backend de Catálogo usando el lockfile que viene en `catalogo/front-catalogo`. Pega el bloque entero. Docker lee las instrucciones de compilación por la terminal.

```powershell
@'
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY front-catalogo/package-lock.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
ENV PORT=3000
ENV NODE_ENV=production
CMD ["node","src/index.js"]
'@ | docker build -f - -t ticketu-catalogo-integracion:local catalogo
```

Levanta Catálogo en el puerto `4000` del equipo. El puerto `3000` queda disponible para el frontend unificado. Esta configuración deja que el cliente de Supabase se inicialice y que el backend use su respaldo en memoria al consultar los datos.

```powershell
docker run -d --name ms-catalogo-eventos --restart unless-stopped `
    --network plataforma-eventos-net --network-alias catalogo-service `
    -p 127.0.0.1:4000:3000 `
    -e SUPABASE_URL=http://127.0.0.1:3000 `
    -e SUPABASE_KEY=solo-integracion-local `
    ticketu-catalogo-integracion:local

Esperar-Http 'http://localhost:4000/health'
```

Copia a Catálogo un evento real del inventario de Entradas. Así los dos servicios usan el mismo ID, el mismo precio y el mismo stock. En una instalación nueva, pega todo el bloque una vez.

```powershell
$id = 'evt-004'
$origen = "http://localhost:3003/api/entradas/eventos/$id"
$destino = 'http://localhost:4000/api/catalogo/eventos'
$evento = Invoke-RestMethod $origen
$cultura = [Globalization.CultureInfo]::GetCultureInfo('es-CL')
$zona = [TimeZoneInfo]::FindSystemTimeZoneById('Pacific SA Standard Time')
$dia = [DateTime]::ParseExact($evento.fecha, "d 'de' MMMM, yyyy", $cultura)
$hora = [regex]::Match($evento.hora, '\d{1,2}:\d{2}').Value
$fechaUtc = [TimeZoneInfo]::ConvertTimeToUtc(
    $dia.Add([TimeSpan]::Parse($hora)), $zona
)
if ($fechaUtc -le [DateTime]::UtcNow -or $evento.stockDisponible -le 0) {
    throw 'Elige en Entradas un evento pagado futuro que tenga stock antes de cargarlo en Catálogo.'
}

$datos = @{
    id_evento           = $evento.id
    nombre_evento       = $evento.titulo
    descripcion_evento  = $evento.descripcion
    lugar_evento        = $evento.lugar
    fecha_evento        = $fechaUtc.ToString('o')
    hora_evento         = $hora
    tipo_evento         = 'pagado'
    categoria_evento    = 'fiesta'
    precio_final_evento = $evento.precio
    stock_actual        = $evento.stockDisponible
}
$body = [Text.Encoding]::UTF8.GetBytes(($datos | ConvertTo-Json))
Invoke-RestMethod $destino -Method Post -ContentType 'application/json; charset=utf-8' -Body $body

(Invoke-RestMethod "$destino/$id").data |
    Select-Object id_evento, nombre_evento, stock_actual, es_pasado
```

Debes ver `es_pasado: False`. La semilla de `evt-004` está fechada el **20 de noviembre de 2026**. Si esa fecha ya pasó o se agotó su stock, busca un evento pagado futuro en el [inventario de Entradas](http://localhost:3003/api/entradas/eventos). Usa su ID en el bloque y en las URLs de prueba. Repite la carga si reinicias Catálogo, ya que este modo guarda los eventos añadidos en memoria.

## 8. PowerShell A — levanta Panel Organizador (API real)

Panel se conecta a la misma red Docker, al mismo Auth y al mismo RabbitMQ. Su Compose de integración no inicia un segundo broker ni publica un puerto HTTP del host; el Gateway lo expone por `/api/organizador/*`.

La clave `AUTH_INTERNAL_API_KEY` de Panel debe ser exactamente la misma `INTERNAL_API_KEY` configurada en `auth/backend/.env`. El siguiente bloque la lee sin imprimirla y la entrega a Compose solo como variable de entorno del proceso:

```powershell
$lineaClave = Get-Content 'auth/backend/.env' | Where-Object { $_ -match '^\s*INTERNAL_API_KEY=' } | Select-Object -First 1
if (-not $lineaClave) { throw 'No se encontró INTERNAL_API_KEY en auth/backend/.env' }
$env:AUTH_INTERNAL_API_KEY = ($lineaClave -replace '^\s*INTERNAL_API_KEY\s*=\s*', '').Trim().Trim('"').Trim("'")
if (-not $env:AUTH_INTERNAL_API_KEY) { throw 'INTERNAL_API_KEY está vacía en Auth' }
$env:AUTH_SERVICE_URL = 'http://auth-service:10000'
$env:ENTRADAS_SERVICE_URL = 'http://entradas-service:3000'
$env:BROKER_URL = 'amqp://ticketu:ticketu_dev@ticketu-rabbitmq:5672/ticketu'
$env:EVENT_EXCHANGE = 'ticketu.events'
$env:SEED_DEMO = 'false'

docker compose --env-file auth/backend/.env -f panel/docker-compose.integracion.yml up -d --build
```

Comprueba el estado y la API desde la red compartida:

```powershell
docker compose --env-file auth/backend/.env -f panel/docker-compose.integracion.yml ps
docker run --rm --network plataforma-eventos-net curlimages/curl:8.10.1 -fsS http://organizador-service:3000/health
```

La respuesta de salud debe identificar `panel-organizador`. No actives `SEED_DEMO=true` a ciegas: el seed de Panel borra los eventos existentes de su MongoDB antes de insertar los siete eventos de demostración. Úsalo solo en una base de pruebas que puedas reinicializar:

```powershell
$env:SEED_DEMO = 'true'
docker compose --env-file auth/backend/.env -f panel/docker-compose.integracion.yml up -d --build --force-recreate organizador-service
$env:SEED_DEMO = 'false'
```

**Advertencia de identidad para los eventos de prueba:** el seed del Panel asigna los eventos `66f1a0000000000000000002` y `66f1a0000000000000000003` al organizador UUID `3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a`. Antes de llamar al endpoint, inicia sesión en Auth con la cuenta ORGANIZADOR propietaria y comprueba que `GET /api/auth/validar-sesion` devuelve ese mismo `usuario.id_usuario`. El seed QA de Auth puede crear UUID distintos; que el correo tenga rol `organizador` no basta para ser propietario del evento. Si los UUID no coinciden, Panel responderá 403 `EVENT_NOT_OWNED`; no es un fallo del consumidor de Notificaciones y no se debe cambiar la identidad desde este proyecto.

Para que la cancelación del evento `66f1a0000000000000000003` emita el mensaje, Entradas también debe conocer ese mismo ID y reportar ventas (`stock < cantidad_entradas`). Además, Notificaciones debe tener filas de compradores para ese `id_evento` en `entradas_usuario`, normalmente alimentadas por el evento real `entradas_emitidas`. El seed de Mongo de Panel, por sí solo, no crea ventas ni asistentes en Entradas/Notificaciones.

## 9. PowerShell A — levanta el Gateway y el frontend unificado

Compila el Gateway oficial en la revisión usada para la prueba. [Repositorio del Gateway de TicketU](https://github.com/FWizav/backendticketU)

```powershell
docker build -t ticketu-gateway-oficial:local `
    'https://github.com/FWizav/backendticketU.git#bea2c1cbcd5d66836b18558e38c55d3bb59f88e0:api-gateway'

docker run -d --name ticketu-api-gateway --restart unless-stopped `
    --network plataforma-eventos-net -p 127.0.0.1:8080:8080 `
    -e AUTH_SERVICE_URL=http://auth-service:10000 `
    -e CATALOGO_SERVICE_URL=http://catalogo-service:3000 `
    -e ENTRADAS_SERVICE_URL=http://entradas-service:3000 `
    -e ORGANIZADOR_SERVICE_URL=http://organizador-service:3000 `
    -e NOTIFICACIONES_SERVICE_URL=http://notificaciones-service:3000 `
    ticketu-gateway-oficial:local

Esperar-Http 'http://localhost:8080/health'
(Invoke-RestMethod 'http://localhost:8080/health').routes |
    Where-Object configured |
    Select-Object module, prefix

Esperar-Http "http://localhost:8080/api/catalogo/eventos/$id"
```

La lista debe incluir `auth`, `catalogo`, `entradas`, `organizador` y `notificaciones`. Luego levanta el único frontend que usarás:

```powershell
$env:NEXT_PUBLIC_GATEWAY_URL = 'http://localhost:8080'
docker compose -f FrontendTitec-main/docker-compose.yml up -d --build
Esperar-Http 'http://localhost:3000/auth'
docker ps
```

Si Docker informa que un nombre o un puerto ya está ocupado, usa `docker ps -a` para identificar el contenedor existente. Si pertenece a esta misma prueba y conserva la configuración correcta, puedes usar `docker start NOMBRE_DEL_CONTENEDOR`. Una instancia adicional de RabbitMQ o del frontend puede ocupar los puertos de esta guía.

## 10. Navegador — ejecuta la prueba de principio a fin

Usa el mismo navegador y la dirección `localhost` en todo el flujo.

1. Abre [Auth](http://localhost:3000/auth), pulsa **Registrarse** y crea un comprador local con un RUT válido, un correo libre y una contraseña. Luego entra en **Iniciar sesión** con esa cuenta.
2. Abre [Fiesta Mechona Info 2026](http://localhost:3000/catalogo/evt-004), anota el stock que muestra la ficha y pulsa **Adquirir Entradas**.
3. Selecciona **1 entrada** y pulsa **Reservar Cupo (Hold)**. En el cuadro de reserva, pulsa **Confirmar Pago, Emitir QR y Sincronizar con Check-in**. Este botón ejecuta el pago simulado de Entradas sin hacer un cobro real. Anota el ID del ticket emitido.
4. Abre [Notificaciones](http://localhost:3000/notificaciones) con la misma cuenta. Busca el aviso **«Tu compra para Fiesta Mechona Info 2026 fue procesada»**.
5. Vuelve a la ficha del evento y recárgala. Debe mostrar una entrada menos que al comienzo, si durante la prueba solo emitiste una.

**La prueba pasa cuando Auth valida al comprador, Entradas emite el ticket, el stock coincide en Catálogo y Entradas, y el aviso de compra aparece para la misma cuenta.**

## 11. PowerShell B (opcional) — comprueba stock, colas y logs

Puedes usar la misma PowerShell A si quedó libre. Si quieres dejar un log abierto mientras compras en el navegador, abre una segunda pestaña de PowerShell. Para estos comandos no necesitas cambiar de carpeta.

**Compara el stock después de la compra:**

```powershell
$id = 'evt-004'
$ficha = Invoke-RestMethod "http://localhost:8080/api/catalogo/eventos/$id"
$inventario = Invoke-RestMethod "http://localhost:8080/api/entradas/eventos/$id/disponibilidad"

[pscustomobject]@{
    Evento        = $ficha.data.nombre_evento
    StockCatalogo = $ficha.data.stock_actual
    StockEntradas = $inventario.stockDisponible
}
```

**Revisa RabbitMQ:**

```powershell
docker exec ticketu-rabbitmq rabbitmqctl list_queues -p ticketu name messages_ready messages_unacknowledged consumers
```

Entradas publica en el exchange `entradas.events` con la routing key `entradas_emitidas`. La cola `notificaciones.entradas_emitidas` debe tener consumidor. Es normal que `messages_ready` vuelva a cero cuando Notificaciones procesa el evento.

**Sigue los logs durante una compra:**

```powershell
docker logs --since 5m -f notificaciones-notificaciones-1
```

Pulsa **Ctrl+C** cuando termine la comprobación. Eso cierra el seguimiento y deja el contenedor corriendo. Luego puedes ver qué publicó Entradas:

```powershell
docker logs --since 5m entradas-service | Select-String 'entradas_emitidas|entrada.emitida'
```

### Si un paso falla

| Síntoma | Comprobación |
| --- | --- |
| Entradas pide iniciar sesión | Abre [Auth](http://localhost:3000/auth) en el mismo navegador, inicia sesión y recarga la ficha. En la pestaña **Red** de las herramientas del navegador, `GET /api/auth/validar-sesion` debe devolver HTTP 200. Un HTTP 401 indica que Auth no pudo validar la cookie de esa sesión. Si el login da 200 y la validación da 400, revisa el formato del RUT guardado para ese comprador. |
| La ficha del evento no aparece en Catálogo | Prueba `Invoke-RestMethod 'http://localhost:8080/api/catalogo/eventos/evt-004'`. Si Catálogo se reinició y devuelve 404, carga el evento de nuevo en el paso 7. Si devuelve 503 o no responde, comprueba el puerto 4000 y la ruta de Catálogo en el Gateway. |
| Hay ticket pero no aparece el aviso | Revisa que `notificaciones.entradas_emitidas` tenga consumidor y que [Notificaciones esté lista](http://localhost:3001/ready). En los logs de Entradas, el evento debe aparecer como publicado en RabbitMQ. Si los servicios arrancaron antes que el broker, aplica la comprobación y el reinicio del paso 6 antes de repetir la compra. |
| Aparece el aviso en la app pero no llega el correo | Revisa la configuración SMTP del remitente en `notificaciones/.env`. Tras cambiarla, ejecuta otra vez el comando de Compose de Notificaciones del paso 6 para cargar los nuevos valores. |


## 12. Prueba conjunta Panel → RabbitMQ → Notificaciones

Esta es la prueba de extremo a extremo que utiliza los datos enviados por el equipo Panel el 18/11/2026. Se hace contra los servicios reales: el cambio se solicita al backend de Panel por el Gateway; no se publica manualmente desde un script de Notificaciones. El frontend independiente de `panel/frontend` documenta un modo mock y no se debe usar su login simulado para certificar esta integración. Aquí se usa la API real y la cookie real emitida por Auth, sin modificar el frontend de Panel.

### 12.1 Login real y comprobación de propietario

En PowerShell A, sustituye el correo por la cuenta ORGANIZADOR propietaria del seed. Para las cuentas QA locales de Auth, la contraseña documentada es `TicketuQA2026!`; el login de STAFF/ORGANIZADOR requiere `admin = $true`.

```powershell
$sesionPanel = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginPanel = @{
    email = 'organizador1@ticketu.test'
    password = 'TicketuQA2026!'
    admin = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' `
    -Method Post -ContentType 'application/json' -Body $loginPanel `
    -WebSession $sesionPanel

$perfilPanel = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/validar-sesion' `
    -WebSession $sesionPanel
$perfilPanel.usuario | Select-Object id_usuario, rol

$idPropietarioEsperado = '3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a'
if ($perfilPanel.usuario.id_usuario -ne $idPropietarioEsperado) {
    throw "La sesión no pertenece al propietario del seed Panel. Esperado $idPropietarioEsperado; recibido $($perfilPanel.usuario.id_usuario). Coordina la identidad/seed con Auth y Panel antes de continuar."
}
```

No pegues ni compartas la cookie JWT en capturas, mensajes o archivos. `WebRequestSession` la conserva y la envía de forma automática.

### 12.2 Reprogramar Feria de Innovación TITEC

El evento `66f1a0000000000000000002` está publicado. Panel debe emitir `evento_reprogramado` con la nueva fecha y hora:

```powershell
$eventoReprogramado = '66f1a0000000000000000002'
$cambios = @{ fecha_evento = '2026-12-13'; hora_evento = '20:00' } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/organizador/v1/panel/eventos/mios/$eventoReprogramado" `
    -Method Patch -ContentType 'application/json' -Body $cambios `
    -WebSession $sesionPanel
```

Resultado esperado: Panel actualiza el evento y su outbox publica en RabbitMQ el cuerpo JSON plano con `type=evento_reprogramado`, routing key `panel.evento.notificaciones.v1`, `id_evento`, `id_usuario`, `nuevo_estado=PUBLICADO`, `fecha_cambio=2026-12-13` y `hora_cambio=20:00:00`. Notificaciones consume el mensaje y crea una notificación `CAMBIO_EVENTO` por cada usuario con entrada activa para ese ID, más la confirmación al organizador.

### 12.3 Cancelar Charla de Ciberseguridad

Antes de ejecutar el DELETE, comprueba que Entradas devuelve el stock de `66f1a0000000000000000003` y que es menor que la capacidad total. Si Entradas devuelve 404, stock igual a capacidad o no conoce ese ID, Panel puede eliminar el evento sin ventas y **no emitirá** `evento_actualizado`.

```powershell
$eventoCancelado = '66f1a0000000000000000003'
Invoke-RestMethod -Uri "http://localhost:3003/api/v1/entradas/eventos/$eventoCancelado/stock" `
    -WebSession $sesionPanel

Invoke-RestMethod -Uri "http://localhost:8080/api/organizador/v1/panel/eventos/mios/$eventoCancelado" `
    -Method Delete -WebSession $sesionPanel
```

Resultado esperado: Panel cambia el estado a `CANCELADO` (no lo borra) y publica `type=evento_actualizado`, `nuevo_estado=CANCELADO`. Notificaciones marca como canceladas las entradas asociadas, notifica solo a los asistentes con entrada activa y crea una confirmación para el organizador.

### 12.4 Revisar la recepción y persistencia

```powershell
# Logs de los dos productores/consumidores
$panelId = docker ps --filter 'name=panel-organizador-integracion-organizador-service' --format '{{.ID}}' | Select-Object -First 1
docker logs --since 10m $panelId 2>&1 | Select-String 'outbox|evento_reprogramado|evento_actualizado|notificaciones'
docker compose --env-file notificaciones/.env -f notificaciones/docker-compose.yml logs --since 10m notificaciones

# Topología: la cola de Panel debe tener consumidor

docker exec ticketu-rabbitmq rabbitmqctl list_bindings -p ticketu source_name destination_name routing_key |
    Select-String 'notificaciones.panel_eventos.v1|panel.evento.notificaciones.v1'

docker exec ticketu-rabbitmq rabbitmqctl list_queues -p ticketu name consumers messages_ready
```

En la base PostgreSQL configurada en `notificaciones/.env`, verifica registros por los IDs reales:

```sql
SELECT id_usuario, tipo, mensaje, datos, fecha_creacion
FROM public.notificacion
WHERE datos->>'id_evento' IN (
  '66f1a0000000000000000002',
  '66f1a0000000000000000003'
)
ORDER BY fecha_creacion DESC;

SELECT n.id_usuario, e.estado, e.intentos, e.fecha_ultimo_intento
FROM public.envios_notificacion e
JOIN public.notificacion n USING (id_notificacion)
WHERE n.datos->>'id_evento' IN (
  '66f1a0000000000000000002',
  '66f1a0000000000000000003'
)
ORDER BY e.fecha_ultimo_intento DESC;
```

Si la notificación de asistentes no aparece pero Panel sí publicó el evento, consulta que `public.entradas_usuario` tenga filas activas con esos mismos IDs. Una compra de otro ID (por ejemplo `evt-004`) no crea asistentes para `66f1...`.

### 12.5 Prueba automatizada del consumidor (complementaria)

La prueba de integración automatizada publica mensajes sintéticos directamente en ambos exchanges, usando el contrato actual (`type` AMQP, routing key estable y cuerpo plano). Sirve para comprobar handler, deduplicación, persistencia y destinatarios; **no sustituye** los pasos 12.1–12.4 que demuestran que Panel real publicó el mensaje.

```powershell
docker compose --env-file notificaciones/.env -f notificaciones/docker-compose.yml `
    --profile test run --rm test-panel-evento
```
