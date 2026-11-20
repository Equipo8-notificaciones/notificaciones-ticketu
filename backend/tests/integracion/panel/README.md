# Prueba automatizada de Panel y Notificaciones

Desde la raíz del proyecto, abre **PowerShell** con Docker Desktop en modo Linux y ejecuta:

```powershell
.\notificaciones\backend\tests\integracion\panel\probar-integracion.ps1
```

El script construye Panel y Notificaciones, carga el seed fijo de Panel en MongoDB y arranca RabbitMQ y PostgreSQL en un proyecto de Docker aislado. Usa los simuladores de Auth y stock de Entradas incluidos por Panel. Cada ejecución retira sus propios contenedores y volúmenes de prueba al finalizar, incluso si falla. La prueba escribe sus resultados en la terminal.

## Casos comprobados

| Caso | Datos y resultado esperado |
| --- | --- |
| Reprogramar Feria de Innovación TITEC | `66f1a0000000000000000002`. El dueño cambia la fecha al `2026-12-13` y la hora a `20:00`. Panel emite `evento_reprogramado`. Notificaciones actualiza la fecha y crea dos avisos APP para compradores activos y un resumen para el dueño. |
| Cancelar Charla de Ciberseguridad | `66f1a0000000000000000003`. El stock simulado es `95` de `120`. El `DELETE` devuelve `CANCELADO`. Panel emite `evento_actualizado` y Notificaciones guarda dos avisos de cancelación y un resumen para el dueño. |
| Reprogramar Torneo Interuniversitario de Ajedrez | `66f1b0000000000000000001`. La organizadora A recibe HTTP 403. El organizador B, que es el propietario, recibe HTTP 200 y los avisos se procesan. |
| Consultar el historial | El historial de la Charla y del Coro Universitario (`66f1a0000000000000000005`) contiene el estado `CANCELADO`. |
| Crear, publicar y eliminar sin ventas | Las tres operaciones producen mensajes de control de Panel en el exchange compartido. Ninguna genera un mensaje para Notificaciones o un aviso guardado. |

Los casos positivos invocan las rutas HTTP de Panel con el prefijo `/api/organizador/v1/panel/eventos`. La prueba captura las publicaciones de Panel en los exchanges `panel.evento.notificaciones.v1` y `ticketu.events` del vhost `ticketu`. Comprueba la routing key `panel.evento.notificaciones.v1`, la propiedad AMQP `type` y el JSON plano con los IDs y estados acordados.

Los tres eventos usan los IDs y fechas de la semilla de Panel. La prueba requiere que esas fechas aún sean futuras cuando se ejecute. Si ya vencieron, hay que acordar con Panel una semilla con nuevas fechas de prueba.
