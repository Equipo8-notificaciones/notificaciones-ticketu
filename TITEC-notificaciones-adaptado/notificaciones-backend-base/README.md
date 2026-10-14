# Módulo de Notificaciones — integración con Supabase, PANEL y AUTH

## Ejecución

Para arrancar el proyecto se debe usar:

```
npm install
npm test
npm start
```

## Páginas HTML de prueba

Los HTML están en la carpeta `Aparte`:

- `simular-entradas.html`: simula la llegada de una compra desde Entradas por HTTP.
- `centro-notificaciones.html`: consulta las notificaciones, las marca como leídas y permite eliminarlas lógicamente.
- `panel-reprogramar-evento.html`: actualiza la fecha de todas las entradas de un evento y establece `estado_evento = 'REPROGRAMADO'`.
- `panel-cancelar-evento.html`: establece `estado_evento = 'CANCELADO'` para las entradas del evento.

Abrir las páginas y mantener `URL del backend` en `http://localhost:3000`. Para que las páginas de PANEL funcionen debe haber filas de ese `id_evento` en `public.entradas_usuario` y el backend debe conectarse a Supabase.

## Registro de intentos

Por cada intento de entrega se inserta una fila en `public.envios_notificacion` con estado inicial `PENDIENTE`. Después se actualiza a `ENVIADO` o `ERROR`; los errores guardan su texto en `error`. Los reintentos crean filas diferentes con `intento = 1, 2, 3`. Por ejemplo, para inspeccionar el historial de una notificación:

```sql
SELECT *
FROM public.envios_notificacion
WHERE id_notificacion = 1
ORDER BY intento, id_envio;
```

También se puede consultar por HTTP en `GET /api/notificaciones/:id/envios`.

## Contratos de eventos

### AUTH → Notificaciones

Routing keys RabbitMQ: `recuperacion_cuenta` y `cuenta_staff`.

`recuperacion_cuenta` acepta:

```json
{
  "Id_usuario": "usr123",
  "email_destino": "a@gmail.com",
  "url": "https://ticketu.cl/restablecer?token=token-generado-por-auth"
}
```

`cuenta_staff` acepta:

```json
{
  "email_destino": "staff@gmail.com",
  "url": "https://ticketu.cl/restablecer?token=token-generado-por-auth"
}
```

El backend crea la notificación `RECUPERACION_PASSWORD` o `CREACION_STAFF`, respectivamente, intenta entregar el correo y publica el resultado en `notificaciones.auth.resultado`. El contrato de respuesta es `email_destino`, `estado_envio` (`exitoso`/`error`) y, cuando corresponde, `error_envio`. En caso de error también se incluye `gmail_destino` como alias de compatibilidad.

La URL y su token los debe producir AUTH. Notificaciones no inventa ni valida tokens de recuperación.

### PANEL → Notificaciones

- `POST /api/panel/reprogramar-evento`: JSON con `id_evento`, `nueva_fecha_evento` (ISO 8601 recomendado) y opcionalmente `nombre_evento`.
- `POST /api/panel/cancelar-evento`: JSON con `id_evento` y, opcionalmente, `nombre_evento` y `motivo`.

También se aceptan los routing keys `reprogramar_evento` y `cancelar_evento`, además del evento legado `evento_actualizado`. Los cambios se realizan en `entradas_usuario`; se notifica por canal APP a usuarios con `entrada_activa = TRUE`. El backend publica un resumen en `notificaciones.panel.resultado` y `notificaciones.auth.resultado`, con `titulo`, `mensaje`, `usuarios_notificados`, `usuarios_no_notificados`, `fecha_envio` y `fecha_envio_iso`.

## Límites de la prueba

- `BROKER_MODE=mock` no recibe mensajes de otro microservicio: sólo permite levantar el backend y probar los endpoints HTTP. Para intercambio real, falta RabbitMQ disponible.
- `canalEnvioService` simula el canal APP; se registra como entrega simulada exitosa.
- Falta configurar correctamente los recordatorios, se programan en memoria pero se pierden al reiniciar Node. En producción conviene usar una cola durable.
- Los endpoints HTML de prueba no incluyen autenticación. No se deben exponer directamente en producción.
