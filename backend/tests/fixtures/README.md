# Prueba de integración Frontend y Notificaciones

`front-notifications.integration.js` verifica el flujo real entre el frontend, Auth y el backend de Notificaciones:

1. Registra un usuario y obtiene su sesión (`jwt_token`) de Auth.
2. Crea una notificación autenticada y comprueba que aparezca en `/api/notificaciones/eventos`.
3. Comprueba que la página y los recursos del frontend estén disponibles y que el cliente use ese endpoint.
4. Marca la notificación como leída y verifica el estado final.

La prueba no inicia Auth, Notificaciones, el frontend ni PostgreSQL. Deben estar ejecutándose antes de correrla. Si no encuentra un Gateway respondiendo en `http://localhost:8080`, inicia temporalmente un puente local que enruta `/api/auth` a Auth y `/api/notificaciones` a Notificaciones; el puente se cierra al finalizar. Este puente es solo para pruebas locales, no es un Gateway de producción.

## Requisitos

- Node.js y npm.
- Docker Desktop con Docker Compose, para PostgreSQL de Auth.
- Dependencias instaladas en Auth, Notificaciones y frontend (`npm install` en cada proyecto si hace falta).
- La base de datos de Auth disponible en `localhost:5432`.
- Auth, Notificaciones y frontend disponibles en los puertos `10000`, `3001` y `3000`. El puerto `8080` debe estar libre para el puente local, o tener un Gateway real configurado.

## Preparar y ejecutar

Abre cuatro terminales PowerShell y deja las tres primeras ejecutándose.

### Terminal 1: PostgreSQL y Auth

```powershell
Set-Location "C:\Users\gherr\Downloads\Notificaciones-Ticketu\auth\backend"
docker compose up -d db
$env:PORT='10000'
$env:NODE_ENV='development'
$env:DATABASE_URL='postgresql://admin:adminpassword@localhost:5432/ticketu?schema=public'
npx prisma db push
npm run start:dev
```

`DATABASE_URL` es necesario para que Auth se conecte a PostgreSQL. Si `npx prisma db push` falla porque el cliente no está generado, ejecuta `npx prisma generate` y vuelve a correr `npx prisma db push`.

### Terminal 2: Notificaciones

```powershell
Set-Location "C:\Users\gherr\Downloads\Notificaciones-Ticketu\notificaciones\backend"
$env:PORT='3001'
$env:AUTH_SERVICE_URL='http://localhost:10000'
$env:AUTH_TIMEOUT_MS='5000'
$env:FRONTEND_ORIGIN='http://localhost:3000'
$env:DATABASE_URL=''
$env:BROKER_MODE='mock'
npm start
```

### Terminal 3: Frontend

```powershell
Set-Location "C:\Users\gherr\Downloads\Notificaciones-Ticketu\notificaciones\FrontendTitec-main"
npm run dev -- --hostname 127.0.0.1 --port 3000
```

El frontend debe tener `NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080` en `.env.local` para que sus llamadas usen el puente de prueba.

### Terminal 4: ejecutar la prueba

```powershell
Set-Location "C:\Users\gherr\Downloads\Notificaciones-Ticketu\notificaciones\backend"
node --test tests\fixtures\front-notifications.integration.js
```

También se puede usar un Gateway real configurando `$env:GATEWAY_URL` antes de ejecutar el test. Para cambiar las URL de los servicios, configura `AUTH_URL`, `NOTIFICATIONS_URL` o `FRONTEND_URL`; sus valores predeterminados son `http://localhost:10000`, `http://localhost:3001` y `http://localhost:3000`.

## Resultado y errores frecuentes

La ejecución correcta muestra `pass 1` y `fail 0`.

- `HTTP 502` con `No se pudo conectar con http://localhost:10000`: Auth no está activo en el puerto configurado o no pudo iniciar. Revisa la terminal de Auth y confirma que se definió `DATABASE_URL`.
- `ECONNREFUSED` a `localhost:8080`: la prueba intenta iniciar su puente local; si el error menciona un upstream, revisa que Auth y Notificaciones estén disponibles en sus puertos.
- `EADDRINUSE`: otro proceso ocupa el puerto requerido. Detén ese proceso o configura otra URL/puerto y usa los valores correspondientes para el frontend y el test.
- `HTTP 429`: Auth aplicó su límite de solicitudes; espera a que se restablezca antes de repetir la prueba.

El test crea un usuario nuevo en la base de Auth por ejecución. Elimina la notificación de prueba al finalizar, pero no elimina el usuario. Al terminar, detén manualmente Auth, Notificaciones, el frontend y PostgreSQL si ya no los necesitas.
