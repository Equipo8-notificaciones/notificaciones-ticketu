# Contrato de interfaz: Auth ↔ Notificaciones

**Equipo Consumidor:** Notificaciones  
**Equipo Proveedor:** Auth  
**Protocolo:** HTTP/REST (Red Interna)  
 **Basado en:** HU9 — Validar sesión e identidad del usuario mediante Auth

---

## 1. Propósito y Arquitectura

El módulo de Notificaciones utiliza Auth como fuente de verdad para validar la identidad y vigencia de la sesión de un usuario. 

Notificaciones **no debe decodificar ni validar el JWT por su cuenta**. Cuando una operación del módulo requiere autenticación o la identidad del usuario, Notificaciones debe solicitar la validación de sesión a Auth mediante el endpoint interno definido en este contrato.

La autorización específica de Notificaciones sobre sus propios recursos continúa siendo responsabilidad de este módulo. Por ejemplo, Notificaciones debe verificar que un usuario autenticado solo pueda acceder, modificar o eliminar sus propias notificaciones.

---

## 2. Operación: Validar Sesión

### 2.1 Descripción

Notificaciones debe validar la sesión del usuario mediante Auth antes de ejecutar operaciones protegidas que requieran conocer su identidad.

Esta validación permite obtener el `id_usuario` y el perfil vigente del usuario para aplicar las reglas de autorización correspondientes.

### 2.2 Quién la expone
Equipo Auth.

### 2.3 Quién la consume
Equipo Notificaciones, en el momento en que un usuario quiere consultar sus notificaciones.

### 2.4 Endpoint propuesto

```http
GET /internal/validar-sesion
```

El endpoint es interno y no debe ser llamado directamente desde el Frontend.

---

## 3. Request (lo que se envía)

Notificaciones debe recibir la cookie de la petición proveniente del Frontend y reenviarla intacta a Auth.

### Ejemplo

```http
GET /internal/validar-sesion HTTP/1.1
Host: auth-service.internal
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Notificaciones **no debe extraer, modificar, regenerar ni reconstruir el JWT**.

---

## 4. Respuesta exitosa

Cuando la sesión es válida, Auth responde `200 OK` y entrega el perfil normalizado del usuario.

### Response

```json
{
  "valido": true,
  "usuario": {
    "id_usuario": "3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a",
    "nombre_completo": "Javier Romero",
    "rut": "21.xxx.xxx-x",
    "correo_electronico": "javier@ejemplo.cl",
    "rol": "usuario"
  }
}
```

Notificaciones utilizará principalmente el `id_usuario` retornado por Auth para asociar y consultar las notificaciones correspondientes al usuario autenticado.

---

## 5. Respuestas de error

Auth puede responder los siguientes códigos:

| Código | Significado | Acción de Notificaciones |
|---|---|---|
| `401 Unauthorized` | Sesión ausente, inválida, expirada, revocada o usuario inexistente/bloqueado. | Detener la operación protegida y retornar `401`. |
| `403 Forbidden` | El servicio no está autorizado para acceder al endpoint interno. | Bloquear la operación y retornar `403`. |
| `500 Server Error` | Error interno de Auth. | Abortar la operación y retornar `500`. |
| `503 Service Unavailable` | Auth no está disponible o existe un timeout. | Abortar la operación y retornar `503`. |

Notificaciones debe aplicar un comportamiento **fail-secure**: si no puede validar la identidad mediante Auth, no debe asumir que el usuario está autenticado.

---

## 6. Reglas de autorización en Notificaciones

La validación realizada por Auth confirma la identidad del usuario, pero las reglas de autorización propias del módulo de Notificaciones son responsabilidad de Notificaciones.

Por lo tanto:

- Solo un usuario cuya sesión haya sido validada por Auth puede acceder a operaciones protegidas del módulo.
- Notificaciones debe utilizar el `id_usuario` entregado por Auth como identidad del usuario autenticado.
- No se debe utilizar un `id_usuario` enviado directamente por el Frontend para determinar la identidad.
- Un usuario solo puede consultar sus propias notificaciones.
- Un usuario solo puede modificar el estado de lectura de sus propias notificaciones.
- Un usuario solo puede eliminar sus propias notificaciones.
- Notificaciones no debe permitir que un usuario acceda a información o notificaciones pertenecientes a otro usuario.
- El rol retornado por Auth corresponde al rol vigente y puede utilizarse cuando una operación de Notificaciones requiera una autorización basada en rol.

---

## 7. Responsabilidades de Notificaciones

Notificaciones debe:

1. Solicitar la validación de sesión a Auth cuando una operación protegida requiera autenticación.
2. Reenviar a Auth la cookie `jwt` recibida desde el Frontend sin modificarla.
3. Utilizar el `id_usuario` retornado por Auth como identidad autenticada.
4. Aplicar las reglas de autorización propias del módulo.
5. No validar localmente la firma ni vigencia del JWT.
6. No registrar el token completo en logs.
7. Propagar los errores de autenticación y disponibilidad según lo definido en este contrato.

---

## 8. Responsabilidades de Auth

Auth debe:

1. Validar la presencia, estructura, firma y vigencia del JWT.
2. Verificar la versión de la sesión (`tokenVersion`) contra la versión vigente.
3. Detectar sesiones revocadas, expiradas, inválidas o asociadas a usuarios inexistentes o bloqueados.
4. Retornar un perfil de usuario normalizado cuando la sesión sea válida.
5. Entregar el rol vigente del usuario.
6. Responder con los códigos HTTP definidos en este contrato.
7. Mantener el endpoint de validación como una operación exclusivamente interna.

---

## 9. Seguridad

- El endpoint `/internal/validar-sesion` es de uso interno y no debe estar expuesto directamente al Frontend ni a Internet.
- La cookie de autenticación es administrada por Auth con las propiedades `HttpOnly`, `Secure` y `SameSite=Strict`.
- Notificaciones no debe registrar el JWT completo en logs.
- Los datos personales retornados por Auth deben tratarse como información sensible.
- Si Auth no está disponible, Notificaciones debe bloquear la operación protegida en lugar de asumir que la sesión es válida.

---

## 10. Flujo de integración

```text
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ Request + Cookie (jwt=...)
       ▼
┌───────────────────────┐
│    Notificaciones     │
└─────────┬─────────────┘
          │ GET /internal/validar-sesion
          │ + Cookie
          ▼
┌───────────────────────┐
│         Auth          │
│ Validación de sesión  │
└─────────┬─────────────┘
          │
          ├── 200 → Perfil e identidad válidos
          ├── 401 → Sesión inválida/expirada/revocada
          ├── 403 → Servicio no autorizado
          ├── 500 → Error interno
          └── 503 → Auth no disponible
          │
          ▼
┌───────────────────────┐
│    Notificaciones     │
│ Aplica autorización   │
│ y ejecuta la operación│
└───────────────────────┘
```

---

## 11. Resumen del contrato

| Concepto | Definición |
|---|---|
| **Proveedor** | Auth |
| **Consumidor** | Notificaciones |
| **Protocolo** | HTTP/REST |
| **Endpoint** | `GET /internal/validar-sesion` |
| **Header requerido** | `Cookie` con `jwt=...` |
| **Identidad válida** | `id_usuario` retornado por Auth |
| **Respuesta exitosa** | `200 OK` |
| **Sesión inválida** | `401 Unauthorized` |
| **Servicio no autorizado** | `403 Forbidden` |
| **Error interno** | `500 Server Error` |
| **Auth no disponible** | `503 Service Unavailable` |
| **Validación JWT** | Responsabilidad exclusiva de Auth |
| **Autorización sobre notificaciones** | Responsabilidad de Notificaciones |
| **Acceso** | Solo mediante red interna |
