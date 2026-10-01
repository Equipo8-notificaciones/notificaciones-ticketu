# Contrato de interfaz: Auth ↔ Notificaciones
* **Versión:** 3.0
* **Equipo consumidor:** Notificaciones
* **Equipo proveedor:** Auth
* **Basado en:** HU7 — Enviar correo de recuperación de contraseña

---

## 1. Propósito
Notificaciones necesita recibir las solicitudes de recuperación de contraseña y cuando cuenta
de Staff sea creada para enviar al usuario el correo correspondiente. Auth es responsable de
enviar los datos correspondientes para el envió del correo.

---

## 2. Operación: Publicar evento recuperacion_cuenta

### 2.1 Descripción
Publica un evento cuando un usuario solicita recuperar su contraseña y publica otro evento
cuando se creada una cuenta de tipo staff.

### 2.2 Quién la expone
Equipo Auth.

### 2.3 Quién la consume
Equipo Notificaciones, en el momento en que Auth procesa una solicitud de recuperación de
contraseña o crea una cuenta de staff.

### 2.4 Endpoint propuesto
[EVENTO ASÍNCRONO]
(La comunicación se realiza mediante un broker de mensajes en formato de evento asíncrono).

### 2.5 Request (lo que se envía)
* **recuperacion_cuenta:**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id_usuario` | `string` | Sí | Identificador del usuario que solicitó la recuperación. |
| `email_destino` | `integer` | Sí | Correo al cual se debe enviar el mensaje. |
| `url` | `string` | Sí | Enlace de recuperación. |

Ejemplo:
```
recuperacion_cuenta:
{
 "Id_usuario": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 "email_destino": "a@gmail.com",
 "url": "https://ticketu.cl/restablecer?token=abc123xyz"
}
```

* **cuenta_staff:**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `email_destino` | `integer` | Sí | Correo al cual se debe enviar el mensaje. |
| `url` | `string` | Sí | Enlace de configuración de cuenta temporal.|

Ejemplo:
```
cuenta_staff:
{
 "email_destino": "staff@gmail.com",
 "url": "https://ticketu.cl/restablecer?token=abc123xyz"
}
```

### 2.6 Response (lo que se recibe)
Para ambos eventos son enviados los datos.

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `email_destino` | `string` | Sí | Correo al que se envio el mensaje. |
| `estado_envio` | `string` | Sí | Resultado del envío: `exitoso` o `error`. |
| `Error_envio` | `string` | No | En caso de existir un error se informará porque se produjo. |

Ejemplo:
```
{
 "email_destino": " a@gmail.com ",
 "estado_envio": "exitoso"
}
```

Ejemplo de Response con Error:
```
{
"gmail_destino": "a@gmail.com",
"estado_envio": "error",
"error_envio": "Rechazo del servidor SMTP de destino"
}
```

### 2.7 Códigos de error
Al tratarse de comunicación asíncrona, no se utilizan códigos HTTP para la respuesta del evento.
Si el envío del correo falla, Notificaciones realizará hasta 3 intentos. Si los tres intentos fallan, se
registrará el error correspondiente.

### 2.8 Tiempo de respuesta esperado (SLA)
El evento debe ser publicado por Auth inmediatamente después de procesar la solicitud de
recuperación, ≤ 5 segundos hasta que Auth recibe confirmación de envío.

---

## 3. Reglas de uso (lado consumidor)
* **recuperacion_cuenta:**
1. Notificaciones permanece suscrito al evento recuperacion_cuenta.
2. Genera y envía el correo utilizando la URL recibida.
3. Si el envío falla, realiza hasta 3 intentos y registra el error si todos fallan.
4. Notifica a Auth si él envió se realizó de forma correcta o incorrecta.

* **cuenta_staff:**
1. Notificaciones permanece suscrito al evento cuenta_staff.
2. Genera y envía el correo utilizando la información recibida.
3. Si el envío falla, realiza hasta 3 intentos y registra el error si todos fallan.
4. Notifica a Auth si él envió se realizó de forma correcta o incorrecta.

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
| Dueño del contrato | Auth | Diego Peña |
| Consumidor principal | Notificaciones | Gabriela Herrera |

---

## 6. Pendientes a acordar (OPCIONAL PREVIO ACUERDO)
- [ ] Confirmar SLA de tiempo de respuesta.
