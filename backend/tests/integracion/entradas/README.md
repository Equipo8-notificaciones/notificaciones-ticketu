# Integración RabbitMQ: Entradas → Notificaciones

## Alcance y acceso a datos

Este test solo necesita acceso al RabbitMQ compartido y a la base Supabase de Notificaciones. No se conecta a MongoDB ni consulta las colecciones de Entradas; el equipo de Notificaciones no tiene acceso a esa base.

El test publica directamente en `entradas.events` un mensaje de prueba con routing key `entradas_emitidas`, usando `evt-77889` (un ID de evento de las semillas de Entradas) y un ID de usuario único. Después comprueba la confirmación publicada por Notificaciones en `notificaciones.events` y que Supabase haya guardado la entrada, las notificaciones APP/EMAIL y sus intentos de envío.

Por lo tanto, valida el consumidor RabbitMQ de Notificaciones y la persistencia en Supabase. No valida que Entradas haya creado una compra o un ticket en MongoDB. Para verificar también ese tramo, el equipo de Entradas debe completar una compra y publicar el evento real, o proporcionar una reserva de prueba que siga en estado `RESERVADO`.

## Requisitos

- RabbitMQ compartido `ticketu-rabbitmq` conectado a `plataforma-eventos-net`.
- Notificaciones ejecutándose con `DATABASE_URL` configurada para Supabase.
- Que el esquema de Notificaciones ya esté creado en Supabase.

El test registra una notificación EMAIL además de la APP. Para impedir que el test contacte un servidor SMTP real, fuerza temporalmente SMTP a `127.0.0.1:1`; el envío fallará localmente y sus intentos quedarán registrados en Supabase.

## Ejecutar en PowerShell

Abre PowerShell y cambia a la carpeta `notificaciones` del proyecto. Con la ubicación actual del proyecto:

```powershell

# Evitar cualquier conexión a un servidor SMTP externo durante la prueba.
computadora gabriela:cd C:\Users\gherr\Downloads\notificaciones_ticketu\notificaciones
$env:SMTP_HOST = '127.0.0.1'
$env:SMTP_PORT = '1'
$env:SMTP_USER = ''
$env:SMTP_PASS = ''
$env:SMTP_FROM = 'prueba@example.com'

docker compose up -d --build --remove-orphans
docker compose --profile test run --build --rm -e TEST_EMAIL_DESTINO=prueba@example.com test-compra-entrada

# Quitar las anulaciones de esta sesión y recrear Notificaciones con la configuración normal.
Remove-Item Env:SMTP_HOST, Env:SMTP_PORT, Env:SMTP_USER, Env:SMTP_PASS, Env:SMTP_FROM
docker compose up -d --force-recreate notificaciones
```

El segundo `docker compose up` restaura los valores configurados en el entorno o en `.env`. Ejecútalo aunque la prueba falle. El test imprime los IDs de usuario y evento que usó. El `id_evento` predeterminado es `evt-77889`; el ID de usuario se genera de nuevo en cada ejecución.

## Consultar el resultado en Supabase

Sustituye el valor de `id_usuario` por el que imprimió el test:

```sql
SELECT eu.id_usuario, eu.id_evento, eu.estado_evento,
       n.id_notificacion, n.canal, n.tipo, n.estado_lectura,
       COUNT(env.id_envio) AS intentos,
       string_agg(DISTINCT env.estado_envio, ',') AS estados_envio
FROM public.entradas_usuario eu
JOIN public.notificacion n
  ON n.id_usuario = eu.id_usuario
 AND n.datos->>'id_evento' = eu.id_evento
LEFT JOIN public.envios_notificacion env
  ON env.id_notificacion = n.id_notificacion
WHERE eu.id_usuario = '<ID_USUARIO_IMPRESO_POR_EL_TEST>'
  AND eu.id_evento = 'evt-77889'
GROUP BY eu.id_usuario, eu.id_evento, eu.estado_evento,
         n.id_notificacion, n.canal, n.tipo, n.estado_lectura
ORDER BY n.canal;
```

Se esperan dos filas, una por cada canal: `APP` y `EMAIL`. El estado del envío EMAIL puede ser `ERROR` si SMTP está deshabilitado; la prueba verifica que el intento y la notificación quedaron registrados, no que un correo real haya sido entregado.
