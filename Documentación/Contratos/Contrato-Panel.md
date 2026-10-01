# Contrato de interfaz: Panel Organizador ↔ Notificaciones
* **Versión:** 1.0
* **Equipo consumidor:** Notificaciones
* **Equipo proveedor:** Panel Organizador
* **Basado en:** HU6 — Recibir notificación por cancelación o cambios de evento y

---

# 1. Propósito
Notificaciones necesita conocer los cambios relevantes en el estado de un evento
(modificaciones y cancelaciones) para informar oportunamente a los usuarios que poseen
entradas activas. Panel Organizador publica un evento cuando un organizador cancela o
modifica el estado de un evento.

---

## 2. Operación: Publicar evento evento_actualizado
### 2.1 Descripción
Publica un evento cuando el estado de un evento cambia y los asistentes deben ser
informados.

### 2.2 Quién la expone
Equipo Panel Organizador.

### 2.3 Quién la consume
Equipo Notificaciones, en el momento en que el organizador realiza una cancelación o cambio
que debe ser comunicado a los asistentes.

### 2.4 Endpoint propuesto
[EVENTO ASÍNCRONO]
(Comunicación vía broker de mensajes asíncrono).

### 2.5 Request (lo que se envía)
| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id_evento` | `integer` | Sí | Identificador del evento modificado. |
| `nuevo_estado` | `string` | Sí | Nuevo estado del evento: `borrador`, `cancelado`, `finalizado` y `reprogramado`. |
| `fecha_cambio` | `timestamptz` | No | Fecha y hora en que se realizó el cambio del evento (en el caso que sea reprogramado) |

Ejemplo:
* evento_actualizado:

```
{
 "id_evento": 45,
 "nuevo_estado": "reprogramado",
 "fecha_cambio": "2026-09-13T:20:00:00",
}
```

### 2.6 Response (lo que se recibe)
| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `Id_evento` `integer` Sí Identificador del evento afectado.
| `estado_envio` | `string` | Sí | Resultado del proceso de envío. Puede ser `exitoso` o `error`. |
| `usuarios_notificados` | `integer` | Cantidad de usuarios a los que se envió la notificación correctamente. |
| `usuarios_faltantes` | `integer` | Cantidad de usuarios a los que se les pudo enviar la notificación correctamente. |
| `fecha_envio` | `timestamptz` | Fecha y hora en que finalizó el proceso de envío. |
| `mensaje` | `string` | Mensaje informativo sobre el resultado del envío. |

Ejemplo:
```
{
 "id_evento": 45,
 "estado_envio": "exitoso",
 "usuarios_notificados": 155,
 "usuarios_faltantes": 0,
 "fecha_envio": "2026-09-13T:20:00:00",
 "mensaje": "Envió realizado correctamente"
}
```

>[!NOTE]
>Panel Organizador no necesita enviar a Notificaciones la lista de
usuarios asistentes. Notificaciones obtiene los usuarios que poseen entradas activas
para el id_evento recibido.

### 2.7 Códigos de error
Al tratarse de comunicación asíncrona, no se utilizan códigos HTTP para la respuesta del
evento.

Los errores de procesamiento o envío serán registrados por Notificaciones. El envío tendrá
hasta 3 intentos antes de registrar el error correspondiente.

### 2.8 Tiempo de respuesta esperado (SLA)
El evento debe ser publicado inmediatamente después de la emisión de las entradas, ≤ 5
segundos. Tomando en cuenta el envío del evento hasta el envió de confirmación de
notificaciones.

---

## 3. Reglas de uso (lado consumidor)
1. Notificaciones permanece suscrito al evento evento_actualizado mediante el broker.
2. Al recibirlo, identifica el evento mediante id_evento y obtiene los usuarios que poseen
entradas activas.
3. Genera y almacena una notificación para cada usuario afectado.
4. Envía las notificaciones y realiza hasta 3 intentos en caso de error.
5. Una vez realizado el proceso, se informa al organizador que “El envío se realizó
correctamente”, cuando corresponda.

---

## 4. Versionado y cambios
* Cualquier cambio en la estructura del evento debe ser versionado y comunicado con
anticipación.
* Cambios que rompan compatibilidad (breaking changes) requieren un período de
transición acordado entre ambos equipos.

---

## 5. Dueños del contrato
| Rol | Equipo | Contacto |
| :--- | :--- | :--- |
|Dueño del contrato | Panel Organizador | María Baxmann |
|Consumidor principal | Notificaciones | Gabriela Herrera |

---

## 6. Pendientes a acordar (OPCIONAL PREVIO ACUERDO)
- [ ] Confirmar SLA de tiempo de respuesta.
