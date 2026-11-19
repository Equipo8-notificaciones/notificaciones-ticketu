# Integraciones Auth ↔ Notificaciones

Para validar **sesiones HTTP**, ejecuta la prueba A. Para validar la inetgración de Staff se toma la prueba B y para validad la de cambio de contraseña la C.

## A. Autenticación de sesiones HTTP

Esta es la prueba de autenticación directa Auth → Notificaciones. El runner está en `tests/auth/test_auth_integration.js` y se ejecuta con `npm run test:auth-integration`.

### Qué comprueba

- Auth y Notificaciones responden y Notificaciones está conectada a Supabase.
- Notificaciones rechaza solicitudes sin cookie y sesiones inválidas.
- Auth registra e inicia sesión para dos compradores de prueba y emite la cookie `jwt`.
- Notificaciones acepta cada sesión y devuelve solo las notificaciones asociadas a ese usuario.
- Cambiar `usuarioId` en la URL no cambia la identidad autenticada.

El test crea dos cuentas de prueba con datos aleatorios en Auth; **esas cuentas quedan en la base de Auth**. Inserta dos notificaciones de prueba en Supabase y las elimina al finalizar. No usa las cuentas de QA de Auth ni envía correos.

### Antes de ejecutarla

- Inicia Docker Desktop.
- Auth debe responder en `http://localhost:10000`.
- Notificaciones debe responder en `http://localhost:3001/ready` con `estado: READY`.
- El archivo `notificaciones/.env` debe tener `DATABASE_URL` configurada y, para el contenedor, `AUTH_SERVICE_URL=http://auth-service:10000`. Esa URL usa el nombre DNS de Auth dentro de la red Docker; no uses `127.0.0.1` allí.
- La red compartida `plataforma-eventos-net`, PostgreSQL de Auth, Keycloak y RabbitMQ deben estar disponibles.

### Paso a paso en PowerShell

Los contenedores se ejecutan en segundo plano con `-d`, así que no hace falta dejar una terminal abierta por cada servicio. Puedes usar una terminal para iniciar los servicios y otra para ejecutar el test.

#### 1. Iniciar Auth

Si la infraestructura de Auth ya está arriba, omite el inicio de dependencias. Si no hay un RabbitMQ compartido ejecutándose, inicia las tres dependencias; si ya hay uno, inicia solo PostgreSQL y Keycloak y confirma que el broker esté en `plataforma-eventos-net`.

```powershell
Set-Location 'C:\Users\gherr\Downloads\notificaciones_ticketu\auth\backend'

# Usa esta opción si no existe un RabbitMQ compartido:
docker compose -f .\docker-compose.yml up -d db keycloak rabbitmq

# Si ya existe el RabbitMQ compartido, usa esta en su lugar:
# docker compose -f .\docker-compose.yml up -d db keycloak

# Inicia Auth:
docker compose -f .\docker-compose.auth-service.yml up -d auth-service

# Comprueba que responde:
Invoke-RestMethod http://localhost:10000/api/health
```

En una instalación nueva, configura antes `auth\backend\.env` y ejecuta una sola vez la inicialización de esquema:

```powershell
docker compose -f .\docker-compose.auth-service.yml --profile setup run --rm prisma-init
```

#### 2. Iniciar Notificaciones

```powershell
Set-Location 'C:\Users\gherr\Downloads\notificaciones_ticketu\notificaciones'
docker compose up -d notificaciones
Invoke-RestMethod http://localhost:3001/ready
```

La respuesta debe indicar `READY` y `base_datos: conectada`.

#### 3. Ejecutar el test desde Windows

Abre otra terminal PowerShell. Instala las dependencias solo la primera vez o si falta `node_modules`. El test carga `DATABASE_URL` desde `notificaciones\.env`.

```powershell
Set-Location 'C:\Users\gherr\Downloads\notificaciones_ticketu\notificaciones\backend'

# Solo la primera vez:
npm ci

# Desde Windows, el test llega a los puertos publicados en el host:
$env:AUTH_SERVICE_URL = 'http://localhost:10000'
$env:NOTIFICACIONES_URL = 'http://localhost:3001'
npm run test:auth-integration

# Limpia las variables de esta terminal:
Remove-Item Env:\AUTH_SERVICE_URL, Env:\NOTIFICACIONES_URL -ErrorAction SilentlyContinue
```

El test se ejecuta desde Windows, no dentro del contenedor. Por eso usa `localhost`; el contenedor de Notificaciones, en cambio, usa `http://auth-service:10000` para llamar a Auth.

### Resultado esperado

Al finalizar correctamente deben aparecer mensajes `OK` para la validación de las cookies `jwt`, el rechazo de sesiones no válidas, el aislamiento de notificaciones y la resistencia a cambiar `usuarioId`.

Si falla con `503`, mira la URL configurada dentro del contenedor y sus logs:

```powershell
Set-Location 'C:\Users\gherr\Downloads\notificaciones_ticketu\notificaciones'
docker inspect notificaciones-notificaciones-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | Select-String '^AUTH_SERVICE_URL='
docker compose logs --tail 80 notificaciones
```

La variable del contenedor debe ser `AUTH_SERVICE_URL=http://auth-service:10000`.

## B. RabbitMQ Staff

Para esta preuba se refire tener instalado obunto y tener acivado Docker aceptando Ubuntu.

Primera terminal:

```powershell
wsl -d Ubuntu

mkdir -p /tmp/titec-docker-cli
printf '%s\n' '#!/bin/sh' 'exec docker.exe "$@"' > /tmp/titec-docker-cli/docker
chmod 700 /tmp/titec-docker-cli/docker
export PATH="/tmp/titec-docker-cli:$PATH"

cd /mnt/c/Users/gherr/Downloads/notificaciones_ticketu

docker version
docker ps --format 'table {{.Names}}\t{{.Status}}'
curl -fsS http://localhost:10000/api/health
curl -fsS http://localhost:3001/ready
```

docker version debe mostrar Client y Server. En la lista deben aparecer ticketu-auth-service, ticketu-rabbitmq y notificaciones-notificaciones-1. Ahora prepara el SMTP seguro y confirma que Notificaciones está listo para consumir:

```powershell
wsl -d Ubuntu

cd /mnt/c/Users/gherr/Downloads/notificaciones_ticketu/notificaciones

export SMTP_HOST=127.0.0.1
export SMTP_PORT=1
export SMTP_USER=disabled
export SMTP_PASS=disabled
export SMTP_FROM=integration@example.invalid

docker compose up -d --force-recreate notificaciones
curl -fsS http://localhost:3001/ready

docker exec notificaciones-notificaciones-1 node -e 'console.log(JSON.stringify({smtpHost:process.env.SMTP_HOST,smtpPort:process.env.SMTP_PORT,userConfigured:Boolean(process.env.SMTP_USER),passwordConfigured:Boolean(process.env.SMTP_PASS)}))'

docker exec ticketu-rabbitmq rabbitmqctl list_queues -p ticketu name consumers messages_ready messages_unacknowledged
```

Comprueba que el resultado SMTP muestre 127.0.0.1, puerto 1, y false para usuario y contraseña. Las colas notificaciones.cuenta_staff y auth.correo_auth deben mostrar consumers mayor que cero. Si no es así, no crees la cuenta todavía.


Segunda terminal, dejala abierta durante el resto de la prueba:

```powershell
wsl -d Ubuntu

export PATH="/tmp/titec-docker-cli:$PATH"
cd /mnt/c/Users/gherr/Downloads/notificaciones_ticketu
python3 auth/backend/tools/qa-notificaciones/02_monitor_eventos.py --since 2
```

En la tercera terminal ingresa los datos tal y como son solicitados. El monitor debería mostrar que Auth publicó cuenta_staff y recibió la respuesta RabbitMQ de Notificaciones. Con SMTP bloqueado es normal ver que el envío de correo falló.

Tercera terminal:
```powershell
wsl -d Ubuntu

export PATH="/tmp/titec-docker-cli:$PATH"
cd /mnt/c/Users/gherr/Downloads/notificaciones_ticketu
python3 auth/backend/tools/qa-notificaciones/01_crear_usuarios.py --env-file auth/backend/.env
```

En la tercera terminal, lista y limpia la cuenta temporal. Cuando el programa lo solicite, escribe exactamente la confirmación que muestra.

Tercera terminal:
```powershell
export PATH="/tmp/titec-docker-cli:$PATH"
cd /mnt/c/Users/gherr/Downloads/notificaciones_ticketu
python3 auth/backend/tools/qa-notificaciones/03_limpiar_usuarios.py --list --env-file auth/backend/.env
python3 auth/backend/tools/qa-notificaciones/03_limpiar_usuarios.py --delete --env-file auth/backend/.env
```

## C. Recuperación de cuenta Auth → RabbitMQ → Notificaciones

Esta prueba invoca `POST /api/auth/recover` para una cuenta COMPRADOR existente, observa el evento `auth.events/recuperacion_cuenta` y la respuesta `notificaciones.events/correo_auth`. No imprime el enlace ni el token de recuperación. SMTP debe permanecer aislado: el estado `error` de entrega es esperado y evita enviar correos reales.

Desde PowerShell, inicia o recrea Notificaciones con un SMTP local cerrado. Usa valores ficticios no vacíos para que Docker Compose no recupere los valores del `.env`:

Terminal 1:

```powershell
export PATH="/tmp/titec-docker-cli:$PATH"
cd /mnt/c/Users/gherr/Downloads/notificaciones_ticketu

docker version
docker ps --format 'table {{.Names}}\t{{.Status}}'
curl -fsS http://localhost:10000/api/health
curl -fsS http://localhost:3001/ready
```

luego:

```powershell
cd /mnt/c/Users/gherr/Downloads/notificaciones_ticketu/notificaciones

export SMTP_HOST=127.0.0.1
export SMTP_PORT=1
export SMTP_USER=disabled
export SMTP_PASS=disabled
export SMTP_FROM=integration@example.invalid

docker compose up -d --force-recreate notificaciones
curl -fsS http://localhost:3001/ready

docker exec notificaciones-notificaciones-1 node -e 'console.log(JSON.stringify({smtpHost:process.env.SMTP_HOST,smtpPort:process.env.SMTP_PORT,userConfigured:Boolean(process.env.SMTP_USER),passwordConfigured:Boolean(process.env.SMTP_PASS)}))'

docker exec ticketu-rabbitmq rabbitmqctl list_queues -p ticketu name consumers messages_ready messages_unacknowledged
```


Terminal 2:
```powershell
wsl -d Ubuntu
export PATH="/tmp/titec-docker-cli:$PATH"
cd /mnt/c/Users/gherr/Downloads/notificaciones_ticketu
python3 auth/backend/tools/qa-notificaciones/02_monitor_eventos.py --since 2
```

Después, ejecuta el runner dentro del contenedor. `TEST_EMAIL_DESTINO` debe ser el correo de una cuenta COMPRADOR ya existente en Auth:

Terminal 3:
```powershell
wsl -d Ubuntu
export PATH="/tmp/titec-docker-cli:$PATH"

read -r -p "Correo de una cuenta COMPRADOR existente: " EMAIL
curl -fsS -X POST http://localhost:10000/api/auth/recover \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${EMAIL}\"}"

```

El resultado esperado muestra cuatro mensajes `OK`. Auth creará un token de recuperación local; el runner no lo revela y el correo no sale del contenedor.