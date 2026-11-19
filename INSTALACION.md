# Notificaciones

**Cuenta local de prueba** · `notificaciones.qa@example.invalid` / `TicketU-Revision-2026!`. Si aún no existe, regístrala en Auth como **Comprador QA Notificaciones** con el RUT de prueba `80.000.000-9`.

Para las pruebas de correo, usa una cuenta de prueba registrada con un correo cuyo buzón puedas abrir. Las pruebas por correo requieren que Notificaciones tenga SMTP configurado.

## Integraciones evaluadas

### 1. Mostrar una notificación de compra de entrada

1. Inicia sesión en **Auth** con la cuenta de prueba.
2. En **Catálogo**, abre un evento gratuito con cupos, pulsa **Adquirir Entradas** y emite una entrada. Verifica que aparezca el ticket.
3. Con la misma sesión, pulsa el icono de **Notificaciones** y busca el aviso de compra.

**Resultado esperado** · El centro muestra un aviso de compra que corresponde al evento del ticket. El inicio de sesión y la adquisición de la entrada preparan el escenario para comprobar ese aviso.

### 2. Recibir el correo de confirmación en Gmail (`entradas_emitidas`)

1. Completa la prueba 1 con una cuenta cuyo correo registrado puedas consultar.
2. Abre ese mismo buzón en Gmail y busca el correo de confirmación de la entrada.

**Resultado esperado** · El correo confirma la adquisición e identifica el evento. Si falla el envío, Notificaciones realiza hasta tres intentos en total.

### 3. Eliminar una o varias notificaciones

**Precondición** · La cuenta tiene al menos una notificación. Si hace falta, completa la prueba 1.

1. Pulsa el icono de **Notificaciones**.
2. Mantén pulsado un aviso durante un segundo para activar el modo de selección. Selecciona los avisos que quieras eliminar y confirma la acción.
3. Recarga la página y revisa el centro de avisos.

**Resultado esperado** · Los avisos seleccionados desaparecen y siguen fuera del listado después de recargar.

### 4. Marcar una notificación como leída

**Precondición** Usa una cuenta con al menos un aviso sin leer.

1. Pulsa el icono de **Notificaciones** y anota el número de avisos sin leer.
2. Haz clic una vez en un aviso sin leer.
3. Recarga la página y revisa ese mismo aviso.

**Resultado esperado** · El aviso sigue visible y marcado como leído. El contador de avisos sin leer disminuye en uno si no llegaron avisos nuevos durante la prueba.

### 5. Marcar varias notificaciones como leídas

**Precondición** Usa una cuenta con al menos dos avisos sin leer.

1. Pulsa el icono de **Notificaciones** y comprueba que haya varios avisos sin leer.
2. Pulsa **Marcar todas como leídas**.
3. Recarga la página y revisa el contador y los avisos.

**Resultado esperado** · Los avisos siguen en el listado y el contador queda en cero si no llegaron avisos nuevos. El cambio se conserva después de recargar.

## Integraciones no evaluadas

### 6. Ver el recordatorio de un evento

1. Completa la prueba 1 con un evento que todavía no haya empezado y que no esté cancelado.
2. Si faltan más de 24 horas, revisa **Notificaciones** cuando falten 24 horas para el evento. Si compras dentro de las últimas 24 horas, revisa el centro después de que Notificaciones procese la compra.

**Resultado esperado** · Aparece un recordatorio en la app con el nombre, la fecha y la hora del evento. Si falla su envío a la app, Notificaciones registra hasta tres intentos. Los recordatorios programados requieren que el backend permanezca en ejecución.

### 7. Recuperar una contraseña (`recuperacion_cuenta`)

**Precondición** Usa una cuenta de comprador registrada con un buzón accesible de correo.

1. En **Auth**, pulsa **¿Olvidaste tu contraseña?** e ingresa el correo de la cuenta de prueba.
2. Abre el correo de restablecimiento, sigue el enlace y define una nueva contraseña.

**Resultado esperado** · Auth publica `recuperacion_cuenta`. Notificaciones envía el enlace y devuelve a Auth el resultado del envío mediante `correo_auth`. El comprador puede iniciar sesión con su nueva contraseña.

### 8. Recibir la invitación de una cuenta Staff (`cuenta_staff`)

1. Auth debe enviar datos mediante rabbitMQ.
2. Abre el correo de invitación recibido y usa el enlace para establecer la contraseña inicial.

**Resultado esperado** · Auth publica `cuenta_staff`. Notificaciones envía la invitación y comunica el resultado mediante `correo_auth`. La cuenta Staff puede completar su primer inicio de sesión.

### 9. Ver el aviso de cancelación de un evento (`evento_actualizado`)

**Precondición** Usuario organizador y comprador existen. Usuario comprador tiene entrada para el evento cancelado.

1. Panel nos envía datos por rabbitMQ.
2. Inicia sesión como el comprador y abre **Notificaciones** para comprobrar la cancelación.
3. Inicia sesión como el organizador y abre **Notificaciones**. para comprobar que recibió el resumen de la operación.

**Resultado esperado** · El comprador recibe un aviso de cancelación. El organizador recibe un resumen con el número de usuarios notificados y pendientes.

### 10. Ver el aviso de reprogramación de un evento (`evento_reprogramado`)

**Precondición** Usuario organizador y comprador existen. Usuario comprador tiene entrada para el evento cambiado.

1. Panel nos envía datos por rabbitMQ.
2. Inicia sesión como el comprador y abre **Notificaciones** para comprobrar la reprogramación.
3. Inicia sesión como el organizador y abre **Notificaciones**. para comprobar que recibió el resumen de la operación.

**Resultado esperado** · El comprador recibe el aviso con los nuevos datos del evento y el organizador recibe un resumen del envío. Notificaciones reprograma el recordatorio con la nueva fecha.
