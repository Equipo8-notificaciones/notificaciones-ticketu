# Contrato de interfaz: Entradas ↔ Notificaciones 
* **Versión:** 3.0
* **Equipo consumidor:** Notificaciones 
* **Equipo proveedor:** Entradas 
* **Basado en:** HU1 - Recibir notificación de compra 

---

## 1.	Propósito 
Notificaciones necesita recibir de Entradas los datos de una entrada emitida con su código QR para enviar el ticket al comprador a su correo. La comunicación se realiza mediante eventos RabbitMQ. Entradas publica el evento entradas_emitidas en el exchange entradas.events y Notificaciones consume dicho evento.

---

## 2. Operación: Enviar entrada emitida por correo 

### 2.1 Descripción 
Notificaciones recibe el evento de una entrada emitida y utiliza los datos recibidos para enviar el ticket al comprador a su correo. 

### 2.2 Quién la expone 
Equipo Entradas 

### 2.3 Quién la consume 
Equipo Notificaciones, en el momento que la entrada este emitida.

### 2.4 Endpoint propuesto 
No aplica. La comunicación se realiza mediante RabbitMQ.

### 2.5 Request (lo que se envía) 
* **Exchange:** entradas.events
* **Evento:** entradas_emitidas

| Nombre del Campo | Tipo de Dato | Nulo / Obligatorio | Descripción y Reglas de Negocio |
| :--- | :--- | :--- | :--- |
| `correo_comprador` | `String` | Sí | Correo validado del cliente |
| `nombre_comprador` | `String` | Sí | Nombre del cliente | 
| `id_usuario` | `String` | Sí | Id del usuario/cliente |
| `nombre_evento` | `String` | Sí | Nombre del evento |
| `id_evento` | `String` | Sí | Identificador único asociado a la creación del evento |
| `fecha_evento` | `String` | Sí | Fecha de evento | 
| `hora_evento` | `String` | Sí | Hora de inicio | 
| `qr_data` | `String` | Sí | URL del QR o contenido en Base64 |

Ejemplo:
```
{ 
  "correo_comprador": "a@gmail.com", 
  "nombre_comprador": "Gabriela",
  "id_usuario": "usr123", 
  "nombre_evento": "Fiesta", 
  "id_evento": "ev23”,
  "fecha_evento": "2026-11-20",  
  "hora_evento": "22:00", 
  "qr_data": "https://storange.midominio.com/qr/tk-12345.png" 
} 
```

### 2.6 Response (lo que se recibe) 

| Nombre del Campo | Tipo de Dato | Nulo / Obligatorio | Descripción y Reglas de Negocio |
| :--- | :--- | :--- | :--- |
| `estado` | `String` | Sí | Estado de la solicitud: `en_cola`, `programado` |
| `mensaje` | `String` | No | Confirmación de la Recepción |

Ejemplo:
```
{ 
  "estado": "programado”, 
  "mensaje": "El envío del correo fue exitoso” 
} 
```

> [!NOTE]
> Se procesa el envío de forma asíncrona. Notificaciones publica la confirmación mediante un evento en su propio Exchange llamados notificaciones.confirmacion_envio desde notificaciones.events.

### 2.7 Códigos de error 
Se enviá de forma asincona mediante un evento, en caso de error (datos faltantes, correo no enviado) este será capturado por Notificaciones y guardado en su base de datos.  
 
### 2.8 Tiempo de respuesta esperado (SLA) 
< 200 ms, considerando solamente la recepción y encolamiento de la solicitud. 

---
  
## 3. Reglas de uso (lado consumidor) 
1. Notificaciones permanece suscrito al evento de entradas_emitidas. 
2. Encola y envía confirmación de encolamiento a Entradas a través del Exchange llamados notificaciones.confirmacion_envio desde notificaciones.events.
3. Envía el correo con el ticket utilizando la información recibida. 
4. Si el envío falla, realiza hasta 3 intentos y registra el error si todos fallan. 
5. La confirmación del envío exitoso o fallido del correo es opcional.

---

## 4. Versionado y cambios 
*	Cualquier modificación en la estructura del request o response debe generar un cambio de versión del contrato. 
*	Los cambios que agreguen eliminen o modifiquen campos deben ser comunicados previamente entre ambos equipos. 

---

## 5. Dueños del contrato 
| Rol | Equipo | Contacto |
| :--- | :--- | :--- |
| Dueño del contrato |	Entradas |	Sebastián Fuentes |
| Consumidor principal |	Notificaciones |	Gabriela Herrera |

---
  
## 6. Pendientes a acordar (OPCIONAL PREVIO ACUERDO) 
Ya acordado
