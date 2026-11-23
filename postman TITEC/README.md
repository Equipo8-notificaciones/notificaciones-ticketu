# Plan de pruebas de Notificaciones en Postman

Importa [Notificaciones.postman_collection.json](Notificaciones.postman_collection.json) y [Notificaciones-local.postman_environment.json](Notificaciones-local.postman_environment.json). Selecciona el entorno **TicketU | Notificaciones local**. 

## Ejecutar desde la raíz del proyecto

Abre PowerShell en la carpeta que contiene `notificaciones/` y ejecuta:

```powershell
docker compose -f notificaciones/postman/docker-compose.yml up -d --build --wait
```

En Postman, abre la colección, pulsa **Run collection** y ejecuta las carpetas 01 a 06 en orden. La carpeta **07 · Gateway** requiere que la integración de TicketU esté levantada en el puerto 8080. También puedes ejecutar la colección con Newman:

```powershell
npx --yes newman@6.2.1 run notificaciones/postman/Notificaciones.postman_collection.json -e notificaciones/postman/Notificaciones-local.postman_environment.json --timeout-request 20000 --timeout-script 10000
```

El laboratorio escucha en `127.0.0.1:3091`. Levanta el backend actual de Notificaciones con PostgreSQL y RabbitMQ propios, identidades ficticias de Auth y un SMTP que captura los mensajes localmente. Las solicitudes del laboratorio usan datos de prueba. `docker compose down` sobre este Compose retira los contenedores y descarta los datos temporales del laboratorio.

## Casos del PDF

| Carpeta | Casos ejecutados por Postman |
|---|---|
| 01 · Centro, estados y autorización | Sesión válida, cookie original, respuesta 401/403, timeout, Auth 5xx y perfiles sin identidad válida. Listado ordenado con empates, asociación al usuario, acceso cruzado, marcar uno y varios, persistencia, borrado lógico individual y múltiple, recuperación del centro y error de almacenamiento. |
| 02 · Entradas, confirmación y SMTP | Publicación válida, datos obligatorios y confirmación de encolamiento. Comprueba el aviso APP en el centro del comprador, la deduplicación, el estado de lectura y los reintentos de APP y SMTP. Verifica destinatario, texto y QR del correo en SMTP. |
| 03 · Recordatorios | Límites alrededor de 24 h, ejecución programada, aviso inmediato dentro de las 24 h, persistencia, usuario sin entrada, acceso ajeno y reintentos del canal APP. |
| 04 · Panel, destinatarios y organizador | Tipos AMQP de cambio y cancelación, duplicados, campos inválidos, múltiples destinatarios, errores e intentos individuales, aviso «No se encuentran compradores para este evento.», evento pasado, reprogramación y cancelación de avisos pendientes. |
| 05 · Eventos de Auth y correo | Recuperación y alta de Staff con campos válidos e inválidos, texto y enlace recibidos por SMTP, fallos y resultado publicado en `notificaciones.events/correo_auth`. |
| 06 · Entrega 3, carga progresiva | Consultas al centro y validación de sesiones simultáneas, operaciones masivas, ráfagas de RabbitMQ, envío masivo a compradores, recordatorios concurrentes y correos con reintentos. Cada etapa informa cantidad, aciertos y duración en la consola de Postman. |
| 07 · Gateway de la integración local | Comprueba la ruta de Notificaciones y la protección del centro cuando falta la sesión. |
| 08 · Compra gratuita y pagada con Entradas real | Login en Auth, emisión gratuita autenticada, reserva y pago simulado, aviso nuevo del mismo comprador y datos de QR. Sigue los pasos de la sección E2E para habilitarla. |

Para carga, el entorno trae etapas de 1, 4 y 8, y un umbral inicial de 8 segundos para completar cada etapa. Estos valores corresponden a esta prueba local. Se pueden cambiar en `carga_etapas`, `carga_max_ms` y `carga_panel_compradores`.

## Aviso de compra dentro del sitio

En Postman, selecciona **02 · Entradas, confirmación y SMTP → Avisos de compra dentro del sitio (APP)** y pulsa **Run** con el entorno **TicketU | Notificaciones local**. Ejecuta las solicitudes en orden. Cada escenario publica `entradas_emitidas` por RabbitMQ y guarda el ID del aviso para los pasos siguientes.

- Consulta `GET /api/notificaciones/eventos`, la ruta que usan la campana y el centro. Comprueba que el comprador vea un solo aviso `COMPRA` del canal `APP`, inicialmente `NO_LEIDA`, con el evento, la fecha, la hora y el QR de la compra. La segunda cuenta de prueba no ve ese aviso.
- Marca el aviso como leído, vuelve a consultar el centro y verifica que siga visible con estado `LEIDA`.
- Fuerza tres fallos de SMTP y comprueba que el aviso APP siga visible y su envío figure como `ENVIADO`. Simula un fallo del canal APP y verifica la secuencia `ERROR → ENVIADO`. Con tres fallos de APP, comprueba los tres registros `ERROR`.

Para revisar la interfaz con Entradas real, ejecuta la carpeta 08 con tu cuenta QA. Luego entra al sitio con esa misma cuenta y abre la campana o `/notificaciones`. Busca la tarjeta **COMPRA** y compara el nombre, la fecha y la hora con la ficha del evento. Abre la tarjeta y recarga el centro para comprobar que siga marcada como leída.

## Verificación en el navegador

Usa una cuenta compradora de pruebas de la integración local para estas comprobaciones visuales del PDF.

1. Abre `http://localhost:3000/notificaciones` con al menos tres avisos sin leer. Abre uno y comprueba que pierda el punto o resaltado. Recarga y verifica que siga leído.
2. Mantén pulsado un aviso de prueba hasta que aparezca el modo de selección. Comprueba que solo quede seleccionado ese aviso. Añade un segundo aviso, confirma la eliminación y recarga. Ambos deben salir del centro.
3. Con DevTools bloquea temporalmente la petición `/api/notificaciones/eventos`. Recarga y comprueba que se muestra un mensaje de error. Quita el bloqueo y recarga para confirmar que vuelve la lista.

## E2E con Auth y Entradas reales

Completa `comprador_email`, `comprador_password`, `evento_gratuito_id` y `evento_pagado_id` con una cuenta de prueba cuyo buzón controlas y dos eventos futuros con stock. Cambia `ejecutar_e2e` a `true` y ejecuta **solo la carpeta 08**. El flujo consume un cupo de cada evento y usa el webhook de pago simulado. La entrada gratuita usa la ruta de Entradas que valida la sesión, `/api/entradas/procesar-compra`.

Después, abre el buzón de prueba y compara los dos correos con los avisos de Postman. Comprueba destinatario, evento, fecha y hora, y el QR de cada entrada. Vuelve a poner `ejecutar_e2e=false` al terminar. El entorno exportado tiene la opción desactivada y los datos de la cuenta vacíos.

Las pruebas de SMTP en las carpetas 02 y 05 comprueban la captura del correo y su contenido. Para el E2E de la carpeta 08, la verificación de llegada se hace en el buzón indicado arriba.

## Resultado local del 23 de noviembre de 2026

Newman ejecutó 107 solicitudes HTTP y aprobó las 249 aserciones. Las 36 pruebas unitarias de Notificaciones pasaron en la corrida anterior. La carpeta 08 quedó desactivada.

La campana y el centro mostraron las tarjetas `COMPRA` con nombre, fecha y hora al cargar las respuestas del laboratorio. Una de las compras tenía tres fallos de SMTP. La segunda cuenta de prueba no vio esos avisos.

El navegador mostró «No se encuentran compradores para este evento.» al cargar el aviso emitido por el laboratorio.

En el navegador se verificó que el resaltado desaparece al marcar un aviso como leído y que la lectura persiste tras recargar. También se comprobó la selección individual y múltiple, la confirmación y persistencia del borrado de dos avisos, el mensaje «Error al mostrar notificaciones» con la petición bloqueada y la recuperación tras desbloquearla. Se usaron avisos de una cuenta QA.

La revisión de la creación encontró que el backend debe fijar el propietario exclusivamente a partir de Auth, antes de guardar el aviso.
