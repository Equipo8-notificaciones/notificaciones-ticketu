# Sprints - Notificaciones

## Sprint 1: Estructura y configuración del módulo
**Objetivo:**
Preparar la estructura base del módulo de Notificaciones, configurando la base de datos y el broker necesarios para su funcionamiento.

**Tareas:**
1.	Crear la estructura del módulo de Notificaciones. 
2.	Configurar la conexión con la base de datos. 
3.	Crear la tabla notificaciones. 
4.	Definir los estados: no_leída, leída y eliminada. 
5.	Definir la estructura de los eventos que recibirá el módulo. 
6.	Configurar la conexión con el broker. 
7.	Configurar la suscripción a los eventos de los módulos. 

**Resultado esperado:**
El módulo de Notificaciones cuenta con su estructura base, conexión a la base de datos y conexión configurada con el broker, quedando preparado para recibir y procesar eventos.

## Sprint 2: Recepción y almacenamiento de notificaciones
**Objetivo:**
Implementar la recepción y almacenamiento de los eventos provenientes de otros módulos, dejando las notificaciones disponibles para su posterior consulta.

**Tareas:**
1.	Crear el consumidor de eventos. 
2.	Implementar la recepción de eventos provenientes de otros módulos. 
3.	Implementar el almacenamiento de las notificaciones recibidas. 
4.	Crear el endpoint para consultar las notificaciones de un usuario. 
5.	Realizar pruebas de recepción y almacenamiento de eventos. 

**Resultado esperado:**
El módulo de Notificaciones recibe los eventos provenientes de otros módulos, almacena correctamente las notificaciones en la base de datos y permite consultarlas mediante el endpoint correspondiente.

## Sprint 3: HU3 - Ver centro de notificaciones
**Objetivo:**
Implementar el centro de notificaciones para que los usuarios puedan consultar las notificaciones almacenadas, visualizándolas de manera ordenada y accediendo a la información asociada a cada una.

**Tareas:**
1.	Crear la interfaz del centro de notificaciones. 
2.	Conectar la interfaz con el endpoint de consulta de notificaciones. 
3.	Obtener las notificaciones correspondientes al usuario. 
4.	Excluir las notificaciones que tengan estado eliminada. 
5.	Ordenar las notificaciones desde la más reciente hasta la más antigua. 
6.	Mostrar las notificaciones en el panel. 
7.	Mostrar la información relevante de cada notificación. 
8.	Permitir visualizar el detalle de una notificación. 
9.	Implementar el manejo de errores durante la carga. 
10.	Mostrar el mensaje "Error en mostrar notificaciones" cuando corresponda. 
11.	Realizar pruebas del centro de notificaciones. 

**Resultado esperado:**
El usuario puede acceder al centro de notificaciones y visualizar sus notificaciones ordenadas desde la más reciente hasta la más antigua. Cada notificación permite consultar la información asociada y las notificaciones eliminadas no se muestran. Si ocurre un problema al cargar la información, el sistema muestra el mensaje "Error en mostrar notificaciones".

## Sprint 4: HU1 - Recibir correo de compra
**Objetivo:**
Implementar la recepción y procesamiento de las solicitudes enviadas por Entradas después de una compra exitosa, permitiendo encolar y programar el envío del ticket por correo electrónico de forma asíncrona.

**Tareas:**
1.	Definir la estructura de la solicitud de envío del ticket. 
2.	Configurar la comunicación entre Entradas y Notificaciones. 
3.	Recibir la solicitud una vez que Entradas haya consolidado la entrada y generado el QR. 
4.	Validar que los campos obligatorios estén presentes. 
5.	Generar el contenido del correo con la información recibida. 
6.	Encolar la solicitud para su envío. 
7.	Enviar mensaje a Entradas indicando estado de Encolado.
8.	Procesar el envío del correo de forma asíncrona. 
9.	En caso de error de envió intentar 3 reintentos.
10.	Registrar errores en caso de existir. 
11.	Realizar pruebas de la HU.

**Resultado esperado:**
Cuando Entradas consolide una compra y genere el código QR, Notificaciones recibe la información necesaria, valida los datos, encola la solicitud y programa el envío del ticket al correo del comprador. La respuesta a Entradas confirma únicamente que la solicitud fue recibida y encolada, permitiendo que el proceso de compra continúe sin esperar el envío del correo.

## Sprint 5: HU2 - Recibir recordatorio del evento 
**Objetivo:**
Implementar un envío automático de recordatorios para informar al usuario sobre sus próximos eventos, recordando 24 horas antes del inicio del evento de forma predeterminada y permitiendo acceder directamente al detalle. En caso de que el usuario haga su compra menor a 24 horas antes del evento, será enviada la notificación de forma inmediata. 

**Tareas:**
1.	Obtener la fecha y hora de los eventos.
2.	Obtener la ubicación del evento.
3.	Identificar los usuarios que poseen entradas activas.
4.	Implementar el proceso automático para revisar eventos próximos.
5.	Configurar las 24 horas antes del evento como período predeterminado.
6.	Considerar los casos en que la entrada fue adquirida con menos de 24 horas de anticipación.
7.	Generar la notificación de recordatorio de forma inmediata.
8.	Incluir el nombre del evento.
9.	Incluir la hora del evento.
10.	Incluir la ubicación.
11.	Crear el enlace hacia el detalle del evento.
12.	Guardar la notificación en la base de datos.
13.	Mostrar el recordatorio en el panel de notificaciones.
14.	Implementar el envío de Push notificación.
15.	Implementar hasta 3 reintentos en caso de fallo.
16.	Registrar el error cuando los 3 intentos fallen.
17.	Realizar pruebas de la HU2.

**Resultado esperado:**
El sistema identifica automáticamente los eventos próximos y envía un recordatorio 24 horas antes de su inicio. La notificación incluye el nombre, hora y ubicación del evento y permite acceder directamente a su detalle. La notificación queda almacenada en el centro de notificaciones. Si la entrada fue adquirida con más de 24 horas de anticipación, el usuario igualmente recibe el recordatorio correspondiente. Si el envío falla, se realizan hasta tres reintentos y se registra el error cuando todos fallen.

## Sprint 6: HU4 - Marcar notificaciones como leídas
**Objetivo:**
Permitir que el usuario pueda identificar sus notificaciones leídas y actualizar ese estado individualmente o de manera conjunta para mantener organizado su centro de notificaciones.

**Tareas:**
1.	Implementar el estado de leidas y no_leidas de las notificaciones.
2.	Diferenciar visualmente las notificaciones no leídas mediante tipografía resaltada.
3.	Implementar el cambio automático a estado leida al abrir una notificación (hacerle clic).
4.	Quitar el resaltado de las notificaciones leídas.
5.	Implementar la opción "Marcar todas como leídas".
6.	Actualizar el estado de todas las notificaciones pendientes.
7.	Mantener el estado de lectura almacenado en la base de datos.
8.	Realizar pruebas de la HU4.

**Resultado esperado:**
El usuario puede distinguir las notificaciones no leídas mediante su tipografía resaltada. Al abrir una notificación, esta se marca automáticamente como leída y deja de estar resaltada. Además, el usuario puede marcar todas las notificaciones pendientes como leídas mediante una sola opción y el estado se mantiene almacenado.

## Sprint 7: HU5 - Borrar notificaciones
**Objetivo:**
Permitir que el usuario pueda seleccionar y eliminar una o varias notificaciones que ya no considere importantes, aun así se mantienen sus registros en la base de datos.

**Tareas:**
1.	Implementar el modo de selección de notificaciones al mantener presionada una notificación durante 2 segundos.
2.	Permitir seleccionar una o varias notificaciones.
3.	Implementar la opción para eliminar las notificaciones seleccionadas.
4.	Solicitar confirmación antes de realizar la eliminación.
5.	Cambiar el estado de las notificaciones seleccionadas a eliminada.
6.	Implementar la no visualización de las notificaciones con estado eliminada.
7.	Mantener el registro de las notificaciones eliminadas en la base de datos.
8.	Realizar pruebas de la HU5.

**Resultado esperado:**
El usuario puede mantener presionada una notificación durante dos segundos para ingresar al modo de selección, seleccionar una o varias notificaciones y eliminarlas después de confirmar la acción. Las notificaciones eliminadas dejan de aparecer en su centro de notificaciones, pero sus registros permanecen en la base de datos con estado eliminada.

## Sprint 8: HU6 - Recibir notificación por cancelación o cambios de evento 
**Objetivo:**
Implementar la recepción y distribución de notificaciones relacionadas con cambios o cancelaciones de eventos, asegurando que todos los asistentes con entradas activas sean informados y que el organizador pueda conocer el resultado del envío.

**Tareas:**
1.	Definir la estructura del evento enviado por el Panel Organizador.
2.	Configurar la suscripción al evento de cambio de estado mediante el broker.
3.	Recibir y procesar el evento publicado por el Panel Organizador.
4.	Identificar el evento mediante su ID.
5.	Identificar a los usuarios con entradas activas para el evento a través de los datos enviados previamente por en Entradas.
6.	Considerar entradas gratuitas y pagadas.
7.	Obtener el nuevo estado del evento.
8.	Obtener la fecha del cambio cuando corresponda.
9.	Crear las notificaciones para los asistentes.
10.	Guardar las notificaciones en la base de datos.
11.	Mostrar las notificaciones en el centro de notificaciones.
12.	Implementar el envío de la notificación a los asistentes correspondientes.
13.	Implementar hasta 3 reintentos en caso de fallo.
14.	Registrar el error cuando los 3 intentos fallen.
15.	Implementar la notificación al organizador indicando "El envío se realizó correctamente" cuando corresponda.
16.	Realizar pruebas de la HU6.

**Resultado esperado:**
Cuando el Panel Organizador publique un cambio en el estado de un evento, el módulo de Notificaciones identifica a todos los usuarios que poseen entradas activas, tanto gratuitas como pagadas, y les envía una notificación con el ID del evento, el nuevo estado y la fecha del cambio cuando corresponda. Las notificaciones quedan almacenadas en el centro de notificaciones. Cuando el envío se realiza correctamente, el organizador recibe una notificación indicando "El envío se realizó correctamente". Si ocurre un fallo, el sistema realiza hasta tres reintentos y registra el error si todos fallan.

## Sprint 9: HU7 - Enviar correo de recuperación de contraseña
**Objetivo:**
Integrar el módulo de Notificaciones con Auth para procesar las solicitudes de recuperación de contraseña, registrar la solicitud y enviar el correo correspondiente, manteniendo la generación y administración del enlace de recuperación bajo la responsabilidad de Auth.

**Tareas:**
1.	Definir la estructura del evento recuperacion_solicitada.
2.	Coordinar con el módulo Auth la información que contendrá el evento.
3.	Configurar la suscripción de Notificaciones al evento mediante el broker.
4.	Recibir y procesar la solicitud enviada por Auth.
5.	Identificar al usuario mediante su correo electrónico.
6.	Recibir el enlace de recuperación proporcionado por Auth.
7.	No generar ni administrar el token desde Notificaciones.
8.	Crear el correo de recuperación de contraseña.
9.	Encolar la solicitud.
10.	Enviar el correo al usuario.
11.	Implementar hasta 3 reintentos en caso de fallo.
12.	Registrar el error cuando los 3 intentos fallen.
13.	Registrar el resultado del envío del correo.
14.	Enviar confirmación o error a Auth.
15.	Realizar pruebas de la HU7.

**Resultado esperado:**
Cuando Auth publique una solicitud de recuperación de contraseña, se recibe el evento mediante el broker, registra la solicitud como "Restablecer contraseña" y envía el correo utilizando el enlace proporcionado por Auth. Notificaciones no genera ni administra el token o enlace de recuperación. Además, registra el resultado del envío y, si esta falla, realiza hasta tres reintentos antes de registrar el error.

## Sprint 10: HU8 - Enviar correo de creación de cuenta Staff
**Objetivo:**
Implementar el envío de un correo electrónico al usuario cuando Auth cree correctamente una cuenta de tipo staff, permitiendo informar al usuario que su cuenta fue creada y registrar el resultado del envío.

**Tareas:**
1.	Definir la estructura del evento de creación de cuenta Staff que publicará Auth.
2.	Configurar la suscripción de Notificaciones al evento mediante el broker.
3.	Crear el contenido que estará en el correo de confirmación.
4.	Recibir y procesar el evento enviado por Auth.
5.	Encolar la solicitud.
6.	Enviar el correo al usuario.
7.	Implementar hasta 3 reintentos en caso de fallo.
8.	Registrar el error si los 3 intentos fallan.
9.	Registrar el envío del correo en la base de datos.
10.	Registrar el estado del envío como exitoso o fallido.
11.	Enviar confirmación o error a Auth. 
12.	Realizar pruebas de la HU8.

**Resultado esperado:**
Cuando Auth cree correctamente una cuenta de tipo staff, Notificaciones recibirá el evento correspondiente y enviará al usuario un correo informando que su cuenta fue creada. El resultado del envío quedará registrado y, si ocurre un fallo, se realizarán hasta tres reintentos antes de registrar el error definitivo
