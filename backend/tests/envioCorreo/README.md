# Pruebas de envío de correo

Estas pruebas usan RabbitMQ, SMTP y, para `entradas_emitidas`, Supabase.
No ejecutes `npm run test:email` directamente en Windows si no instalaste las dependencias. Se publican mensajes directamente como si fueramos Auth y Entradas; no se ejecuta el flujo real ni verifican la outbox y la recepción de la respuestas. Se hace en modo de verfificación de nuestras funcionalidades.

## Preparar servicios

Desde la carpeta `notificaciones`:

```powershell
cd C:\Users\gherr\Downloads\notificaciones_ticketu\notificaciones
docker compose build notificaciones
docker compose up -d notificaciones
docker compose ps
```

RabbitMQ debe estar levantado por el entorno compartido y conectado a `plataforma-eventos-net`.

Las tres pruebas usan exclusivamente `g.herreraosorio@gmail.com` como
destinatario. La variable `TEST_EMAIL_DESTINO` no cambia ese destinatario.

## Ejecutar pruebas

```powershell
docker compose exec -T notificaciones node tests/envioCorreo/test_recuperacion_cuenta_rabbitmq.js
docker compose exec -T notificaciones node tests/envioCorreo/test_cuenta_staff_rabbitmq.js
docker compose exec -T notificaciones node tests/envioCorreo/test_entradas_emitidas_rabbitmq.js
```

## Resultado esperado

Debe aparecer `OK` en cada prueba. Revisa también Spam/Promociones.
Si falla, consulta:

```powershell
docker compose logs --since 5m notificaciones
```

Si aparece `Cannot find module`, vuelve a ejecutar `docker compose build notificaciones`;
la imagen debe reconstruirse después de crear o modificar estas pruebas.
