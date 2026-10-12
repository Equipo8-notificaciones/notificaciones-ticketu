# Diagrama Relacional - Notificaciones

## Diagrama Inicial (Actual)
<img width="3167" height="1757" alt="Diagramav1" src="https://github.com/user-attachments/assets/41b51f3c-7026-4603-a21a-3e62614fcf0b" />

---

## Diagrama Final (Propuesta)
<img width="3171" height="1560" alt="Diagramav2" src="https://github.com/user-attachments/assets/77df6bc6-a1fc-48a0-bf35-7c0d41664988" />

**Cambios**
* Se elimina la tabla que guarda datos desde **AUTH** con el propósito de que se manejen desde el backend únicamente
* Muchos de los datos recibidos desde **ENTRADAS** son enviados únicamente por correo, solo dejamos en la base de datos los que necesitamos para las modificaciones realizadas por **PANEL** y su respuesta, el resto se alojan en el archivo json de la tabla `notificacion` 

---

https://lucid.app/lucidchart/cd38c646-5308-4138-bca2-b8a98726df8e/edit?viewport_loc=2421%2C-3735%2C4081%2C2124%2C0_0&invitationId=inv_3a84ead7-0a95-4b26-b4fc-0f7ce2a14be1
