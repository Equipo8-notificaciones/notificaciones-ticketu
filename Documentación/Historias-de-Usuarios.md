# Historias de Usuarios - Notificaciones

## HU1 - Recibir notificación de compra por correo
Como comprador, quiero recibir por correo electrónico mi entrada una vez que mi compra haya sido procesada y el QR haya sido generado, para disponer de mi ticket y poder utilizarlo para asistir al evento. 

**Criterios de Aceptación**
*	La solicitud de envío se recibe cuando Entradas ha consolidado la entrada y generado el código QR. 
*	La solicitud contiene el correo y nombre del comprador, nombre, fecha y hora del evento, cantidad de entradas y código QR. 
*	Notificaciones encola y programa el envío del correo de forma asíncrona. 
*	El correo contiene la información del evento y el código QR correspondiente. 
* Notificaciones responde confirmando que la solicitud fue encolada correctamente, sin esperar a que el correo haya sido entregado. 
*	Si faltan para metros obligatorios, la solicitud es rechazada. 
*	Si ocurre un error al encolar el correo, se informa el error correspondiente. 
*	Si falla el envío de la notificación, se reintenta el envío 3 veces y se registra el error. 

**Política de seguridad (autorización):**
* El envío de la entrada por correo solo está autorizado para el correo electrónico del comprador proporcionado por Entradas. 
*	La entrada y el código QR no pueden ser enviados a un correo electrónico distinto del informado por Entradas. 

**DoD de equipo:**
*	Pruebas unitarias que simulan el encolado asíncrono y los 3 reintentos ante fallos.
*	Pruebas de integración con la plantilla de correo y renderizado del código QR.
*	Revisión de código enfocada en el manejo asíncrono y gestión de errores.

**DoD de integración:**
*	Verificación de cumplimiento de contrato entre el módulo de Entradas y Notificaciones.
*	Verificación de la recepción de eventos emitidos desde Entradas.
*	Confirmación de que Entradas recibe la respuesta asíncrona.

---


## HU2 - Recibir recordatorio del evento 
Como asistente a un evento, quiero recibir un recordatorio antes de que comience el evento, para no olvidarlo. 
 
**Criterios de aceptación:** 
* El sistema envía automáticamente un recordatorio dentro del sitio web 24 horas antes del inicio del evento, utilizando este período como valor predeterminado.
* La notificación muestra el nombre del evento, la hora y la ubicación.
* El usuario puede acceder al detalle del evento directamente desde la notificación.
* La notificación es mostrada en el panel de notificaciones.
* En el caso que haya una entrada emitida posterior a las 24 horas antes del evento. Se enviará el recordatorio de forma inmediata.
* Si falla el envío de la notificación, se reintenta el envío 3 veces y se registra el error. 
 
**Política de seguridad (autorización):**
* Solo un usuario autenticado puede acceder a sus propias notificaciones.
* El recordatorio solo se genera y muestra a usuarios que hayan comprado una o más entradas para el evento correspondiente.
* Un usuario no puede acceder a las notificaciones ni a los recordatorios asociados a otros usuarios. 

**DoD de equipo:**
* Pruebas unitarias sobre la lógica de temporización (24h antes e inmediato según la fecha de emisión).
* Pruebas de interfaz para la interacción y redirección al detalle del evento.
* Revisión de código verificando los controles de acceso y autenticación.

---

## HU3 - Ver centro de notificaciones 
Como usuario, quiero visualizar todas mis notificaciones en un solo lugar, para consultar información relacionada con mis compras, eventos y recordatorios anteriores. 
 
**Criterios de aceptación:**
* El sistema muestra todas las notificaciones del usuario en el centro de notificaciones.
* Las notificaciones se presentan ordenadas cronológicamente, mostrando las más recientes primero.
* Cada notificación permite visualizar la información relevante asociada a ella.
* La notificación es mostrada en el panel de notificaciones.
* Si no se muestran las notificaciones de la forma esperada, se mostrará “Error en mostrar notificaciones". 
 
**Política de seguridad (autorización):**
* Solo un usuario autenticado puede acceder al centro de notificaciones.
* El usuario solo está autorizado a visualizar sus propias notificaciones.
* Un usuario no puede acceder ni visualizar las notificaciones asociadas a otro usuario. 

**DoD de equipo:**
* Pruebas unitarias del ordenamiento cronológico y manejo de estados de error.
* Pruebas de interfaz sobre el panel de notificaciones en diferentes pantallas.
* Revisión de código asegurando la validación del token de autenticación y que muestre notificaciones asociadas a su ID.

**DoD de integración:**
* Verificación del endpoint del centro de notificaciones frente al gateway de autenticación.

---

## HU4 - Marcar notificaciones como leídas 
Como usuario, quiero marcar una o varias notificaciones como leídas, para mantener organizado mi centro de notificaciones. 
 
**Criterios de aceptación:**
* Las notificaciones no leídas se distinguen mediante una tipografía resaltada.
* Al abrir una notificación, esta se marca automáticamente como leída y su tipografía deja de estar resaltada.
* El usuario dispone de una opción "Marcar todas como leí das" para actualizar el estado de todas las notificaciones pendientes.
* La notificación es mostrada en el panel de notificaciones. 
 
**Política de seguridad (autorización):**
* Solo un usuario autenticado puede marcar notificaciones como leí das.
* El usuario solo puede modificar el estado de lectura de sus propias notificaciones.
* Un usuario no puede marcar como leí das las notificaciones asociadas a otro usuario. 

**DoD de equipo:**
* Pruebas unitarias para la actualización individual y masiva del estado de lectura.
* Pruebas de UI/UX verificando el cambio correcto de estilos CSS según el estado de lectura.

---

## HU5 - Borrar notificaciones  
Como usuario, quiero poder eliminar las notificaciones que ya no considero importantes para visualizar notificaciones de mayor importancia más fácilmente. 
 
**Criterios de aceptación:**
* Al mantener presionada una notificación durante 2 segundos, el usuario podrá ingresar al modo de selección.
* El usuario podrá seleccionar una o varias notificaciones para eliminarlas.
* El sistema solicitará confirmación antes de eliminar las notificaciones seleccionadas.
* Las notificaciones eliminadas dejarán de visualizarse en el centro de notificaciones. – El registro de la notificación se mantiene en la base de datos, pero queda marcado con un estado de eliminado.
* La notificación es mostrada en el panel de notificaciones. 
 
**Política de seguridad (autorización):**
* Solo un usuario autenticado puede eliminar notificaciones.
* El usuario solo puede eliminar sus propias notificaciones.
* Un usuario no puede eliminar las notificaciones asociadas a otro usuario.
* La eliminación de una notificación autorizada corresponde a una eliminación lógica, manteniendo su registro en la base de datos. 

**DoD de equipo:**
* Comprobar el cambio delete en base de datos.
* Pruebas de UI sobre el evento de presión prolongada de 2 segundos y su confirmación.
* Revisión del front y back asegurando que las consultas descarten registros eliminados.

---

## HU6 - Recibir notificación por cancelación/cambios de evento 
Como asistente con una entrada activa, quiero recibir una notificación cuando un evento sea cancelado o cambiado, para enterarme oportunamente. 
 
**Criterios de aceptación:**
* Se envía una notificación cuando el Panel Organizador publica un cambio en el estado del evento.
* La notificación se envía a todos los usuarios con entradas activas del evento, tanto gratuitas como pagadas.
* La notificación incluye el ID del evento, nuevo estado y fecha de cambio, si corresponde.
* La notificación queda almacenada en el centro de notificaciones.
* Una vez enviada la notificación a los asistentes del evento, se le informara al organizador a través de una notificación diciendo "El envío se realizó correctamente".
* Si falla el envío de la notificación, se reintenta el envío 3 veces y se registra el error. 
 
**Política de seguridad (autorización):**
* Solo los usuarios autenticados que hayan comprado una o más entradas para el evento correspondiente esta n autorizados a recibir la notificación.
* La autorización aplica tanto para entradas gratuitas como pagadas, siempre que el usuario posea una entrada activa para el evento.
* Un usuario que no posea una entrada activa para el evento no está autorizado a recibir la notificación de cancelación o cambio. 

**DoD de equipo:**
* Pruebas unitarias para la iteración masiva de envíos y lógica de reintentos.
* Pruebas de integración con la notificación de retorno hacia el organizador.

**DoD de integración:**
* Verificación de cumplimiento de contrato entre el módulo de Panel y Notificaciones.
* Verificación de la recepción de eventos emitidos desde el módulo Panel Organizador.
* Confirmación de que Entradas recibe la respuesta con una notificación.

---

## HU7 - Enviar correo de recuperación de contraseña  
Como usuario, quiero recibir un correo con un enlace para restablecer mi contraseña, para recuperar el acceso a mi cuenta de forma segura. 
 
**Criterios de aceptación:**
* Se envía un correo cuando el módulo de Autenticación (Auth) publica el evento de solicitud de recuperación de contraseña.
* Se escucha la solicitud, no se genera el token ni se maneja el enlace.
* El envío del correo queda registrado por el módulo de Notificaciones.
* Si falla el envío de la notificación n, se reintenta el envío 3 veces y se registra el error.
* Se le envía una confirmación a Auth de que el envío fue realizado con éxito; en caso de fallo, también es informado. 
 
**Política de seguridad (autorización):**
* El envío del correo de recuperación solo está autorizado para la dirección de correo electrónico proporcionada por Auth.
* Notificaciones solo puede enviar el correo a la dirección proporcionada por Auth y no puede modificarla ni utilizar una dirección distinta. 

**DoD de equipo:**
* Pruebas unitarias que simulan la recepción del evento desde Auth y la respuesta de confirmación.
* Revisión de código enfocada en seguridad (como no alteración de la dirección de correo recibida).

**DoD de integración:**
* Verificación de cumplimiento de contrato entre el módulo de Auth y Notificaciones.
* Verificación de la recepción de eventos emitidos desde el módulo Auth.
* Confirmación de que Auth recibe la respuesta del envío correcto del correo.

---

## HU8 - Enviar correo de creación de cuenta Staff 
Como usuario con una cuenta Staff recién creada, quiero recibir un correo informándome que mi cuenta ha sido creada, para poder utilizar mi cuenta y comprobar que el registro se realizó correctamente.
 
**Criterios de aceptación:**
* Se envía un correo cuando el módulo de Auth publique el evento de creación de una cuenta de tipo Staff.
* Se escucha la solicitud.
* El correo enviado indica que la cuenta Staff ha sido creada correctamente.
* El envío del correo queda registrado por el módulo de Notificaciones.
* Si el envío falla, se realizan hasta 3 reintentos y se registra el error si todos fallan.
* Se le envía una confirmación a Auth de que el envío fue realizado con éxito; en caso de fallo, también es informado. 
 
**Política de seguridad (autorización):**
* El envío del correo de creación de cuenta solo está autorizado para la dirección de correo electrónico proporcionada por Auth. 
* Notificaciones solo puede enviar el correo a la dirección proporcionada por Auth y no puede modificarla ni utilizar una dirección distinta. 
 
**DoD de equipo:**
* Pruebas unitarias que simulan la recepción del evento desde Auth y la respuesta de confirmación.
* Revisión de código enfocada en seguridad (como no alteración de la dirección de correo recibida).

**DoD de integración:**
* Verificación de cumplimiento de contrato entre el módulo de Auth y Notificaciones.
* Verificación de la recepción de eventos emitidos desde el módulo Auth.
* Confirmación de que Auth recibe la respuesta del envío correcto del correo.
