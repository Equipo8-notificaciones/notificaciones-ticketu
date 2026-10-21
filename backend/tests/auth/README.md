# Test automático: autenticación y notificaciones

Este test prepara y ejecuta por sí solo el flujo local de Auth y Notificaciones:

- Inicia PostgreSQL de Auth con Docker Compose y espera a que esté listo.
- Genera las llaves RSA locales de Auth solo si todavía no existe ninguna.
- Prepara Prisma y compila Auth.
- Inicia Auth en `http://localhost:10000` y Notificaciones en `http://localhost:3001` cuando no están activos.
- Registra un usuario de prueba, inicia sesión, valida `jwt_token` y comprueba el centro protegido de Notificaciones.
- Cierra al terminar los servicios y la base que haya iniciado el propio test. No detiene servicios que ya estaban activos.

## Ejecutar

1. Inicia Docker Desktop.
2. Abre una terminal PowerShell.
3. Copia y pega:

```powershell
Set-Location "C:\Users\gherr\Downloads\Notificaciones-Ticketu\notificaciones\backend"
npm run test:auth-integration
```

El test genera las credenciales automáticamente y no imprime la contraseña. Requiere Docker Compose, Node.js y npm. Si faltan las dependencias de Auth o Notificaciones, el test ejecuta `npm install` en el proyecto correspondiente.

El resultado esperado es `pass 1` y:

```text
Correcto: registro, login, cookie, validación y centro vacío ([]).
```

El test registra un usuario nuevo en la base de Auth en cada ejecución y no lo elimina. Las llaves RSA locales también se conservan. Si ya existe solo una de las dos llaves, el test se detiene sin sobrescribirla.
