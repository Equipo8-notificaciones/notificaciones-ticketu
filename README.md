# Pruebas de Integración en Postman - Módulo Notificaciones

## Herramienta

- **Postman Desktop** con colección y environment exportados.
- Se evalúa la **definición** de los servicios de integración.

## Estructura
```text
        postman/
        ├── coleccionNotificaciones.json       # Colección HTTP con scripts de test
        ├── entornoNotificaciones.json         # Variables para ejecución local
        ├── mock-auth/
        │   ├── Dockerfile                     # Imagen del Auth simulado
        │   └── server.js                      # Servidor Auth simulado
        ├── evidencias/                        # Capturas reales de Postman
        └── README.md                          # Este documento
```

## Cómo importar

1. Abrir Postman Desktop.
2. Seleccionar **Import**.
3. Importar `coleccionNotificaciones.json` y `entornoNotificaciones.json` desde `postman/`.
4. En el selector de entornos, seleccionar **`entornoNotificaciones (mock local)`** (el nombre puede aparecer con la denominación definida en el JSON importado).
5. Comprobar las variables:

| Variable | Valor local | Descripción |
|---|---|---|
| `baseUrl` | `http://localhost:3001` | URL local de Notificaciones. No cambiar el puerto. |
| `jwtToken` | `postman-test-token` | Token ficticio aceptado solamente por el Auth mock local. |
| `notificationId` | Se completa al crear una notificación | Identificador usado por las solicitudes posteriores. |
| `notificationIdSecundaria` | Se completa al crear una segunda notificación | Segundo identificador para el borrado múltiple. |

## Cómo ejecutar

1. Click derecho sobre la colección "Notificaciones - TicketU".
2. Seleccionar "Run collection".
3. Click en "Run Notificaciones - TicketU".
4. Postman ejecutará los 11 requests y mostrará los resultados.

## Casos de prueba
La colección actual contiene **14 solicitudes y 26 tests automatizados definidos**. La cantidad de tests aprobados debe tomarse del resultado real del Runner después de cada ejecución; no se debe copiar el resultado histórico de la colección inicial.

### 1. Salud y documentación

| Caso | Solicitud | Método | Resultado esperado |
|---|---|---|---|
| 1 | `/health` | GET | `200 OK`; servicio Notificaciones disponible. |
| 2 | `/api-docs` | GET | `200 OK`; documentación Swagger disponible. |

### 2. Operaciones propias de Notificaciones

| Caso | Solicitud | Método | Resultado esperado |
|---|---|---|---|
| 3 | `/api/notificaciones` | POST | `201 Created`; se crea una notificación y se devuelve su identificador. |
| 4 | `/api/notificaciones` | GET | `200 OK`; devuelve las notificaciones del usuario autenticado. |
| 5 | `/api/notificaciones/eventos` | GET | Respuesta correcta del alias de eventos definido para el frontend. |
| 6 | `/api/notificaciones/{id}` | GET | `200 OK`; devuelve la notificación solicitada. |
| 7 | `/api/notificaciones/{id}/envios` | GET | `200 OK`; consulta el historial de intentos de envío de esa notificación. |
| 8 | `/api/notificaciones/{id}/leida` | POST | `200 OK`; actualiza la notificación a estado leída. |
| 9 | `/api/notificaciones/marcar-todas-leidas` | POST | `200 OK`; devuelve el resultado de marcar las pendientes. Puede ser un array vacío si no quedan pendientes. |
| 10 | `/api/notificaciones` | POST | `201 Created`; crea una segunda notificación para preparar el borrado múltiple. |
| 11 | `/api/notificaciones` | POST | `201 Created`; crea otra notificación para la prueba de borrado individual. |
| 12 | `/api/notificaciones` | DELETE | `200 OK`; realiza el borrado lógico de los identificadores enviados. |
| 13 | `/api/notificaciones/{id}` | DELETE | `200 OK`; realiza el borrado lógico de la notificación. |

### 3. Validación de autenticación

| Caso | Solicitud | Método | Resultado esperado |
|---|---|---|---|
| 14 | Solicitud protegida sin cookie de sesión | Según la solicitud de la colección | `401 Unauthorized`; verifica que una petición sin sesión no pueda acceder a una ruta protegida. |

## Resultado final

- **11 requests** en la colección.
- **23 tests ejecutados** (3 tests por request principal + tests de definición).
- **23 tests pasados** (100%).
- **8 requests propios** ejecutados con respuestas 200/201.
- **3 requests simulados** con definición documentada (no se envían por apuntar a localhost, es lo esperado)

## Resumen del Runner de Postman

    All tests: 26
    Passed: 26
    Failed: 0
    Errors: 0

## Evidencia de ejecución

Capturas de cada request ejecutado de Postman. Se encuentran en la carpeta `evidencias/`.

### 1. Servicios propios

**- GET /health - Estado del servicio**
<img width="1223" height="322" alt="image" src="https://github.com/user-attachments/assets/254d1c4d-4391-49e2-95ac-aba450e8dbb0" />

**- POST /api/notificaciones - Crear notificación**
<img width="1225" height="590" alt="image" src="https://github.com/user-attachments/assets/eecc39c7-ef69-4be8-825f-9df5d625390d" />

**- GET /api/notificaciones - Listar notificaciones**
<img width="1230" height="575" alt="image" src="https://github.com/user-attachments/assets/2227641d-cb58-4ecd-9fec-f99cb599e260" />

**- GET /api/notificaciones/:id - Obtener por ID**
<img width="1226" height="560" alt="image" src="https://github.com/user-attachments/assets/555bd4e1-f396-4de4-828c-cfc993c87b9e" />

**- POST /api/notificaciones/:id/leida - Marcar como leída**
<img width="1226" height="556" alt="image" src="https://github.com/user-attachments/assets/383de946-d07d-4fbc-a82d-6290e8984903" />

**- POST /api/notificaciones/marcar-todas-leidas**
<img width="1220" height="482" alt="image" src="https://github.com/user-attachments/assets/801a4a93-4954-45e3-8c2f-872d656c677d" />

Observación: La respuesta es un array vacío `[]` porque en el paso anterior ya se marcó la única notificación como LEIDA, por lo que no había notificaciones marcadas como NO_LEIDA pendientes de actualizar, por lo que el test pasa correctamente verificando Status 200 y tipo array.

**- GET /api/notificaciones/:id/envios - consultar historial de envios**
<img width="1228" height="472" alt="image" src="https://github.com/user-attachments/assets/fb4f8bfe-3c80-46f8-bee4-fb8f49470064" />

**- DELETE /api/notificaciones/:id - Eliminar una**
<img width="1217" height="562" alt="image" src="https://github.com/user-attachments/assets/96d03713-b719-48d8-a73b-6b2bc8e08aea" />

**- DELETE /api/notificaciones - Eliminar varias (borrado logico)**
<img width="1227" height="585" alt="image" src="https://github.com/user-attachments/assets/00d480af-6291-4afb-a471-58b6ea6a2986" />

**- GET /api-docs/ - Swagger disponible**
<img width="1217" height="585" alt="image" src="https://github.com/user-attachments/assets/dd06d92a-038f-4109-8c9a-0756516c9f3e" />

**- GET /api/notificaciones/eventos - Alias de Eventos para el Front**
<img width="1222" height="610" alt="image" src="https://github.com/user-attachments/assets/24e66573-85ff-4088-9d27-3d6a23351096" />

**- POST /api/notificaciones - Crear segunda notificacion (para borrado multiple)**
<img width="1218" height="556" alt="image" src="https://github.com/user-attachments/assets/1fa5108a-e816-4a2b-bc8a-37c511015209" />

**- POST /api/notificaciones - Crear tercera notificacion (para borrado individual)**
<img width="1226" height="562" alt="image" src="https://github.com/user-attachments/assets/81a9065b-688c-4a0e-b458-2e9e785a7d18" />

**- POST /api/notificaciones - Sin Cookie de sesion**
<img width="1223" height="755" alt="image" src="https://github.com/user-attachments/assets/fa5d32fe-ee84-4a12-a7d1-8385df69751c" />
