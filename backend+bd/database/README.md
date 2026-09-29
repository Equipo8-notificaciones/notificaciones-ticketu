# Base de datos - Notificaciones

Esta carpeta fue añadida al backend base. Los archivos originales del proyecto no fueron modificados.

## Archivo principal

- `schema.sql`: crea las tablas, restricciones, índices y trigger necesarios para el módulo de Notificaciones en Supabase/PostgreSQL.

## Ejecución en Supabase

1. Abrir el proyecto de Supabase.
2. Ir a **SQL Editor**.
3. Crear una nueva consulta.
4. Copiar y ejecutar el contenido de `schema.sql`.
5. En **Database > Replication / Realtime**, verificar que `public.notificaciones` esté habilitada para Realtime.

## Correcciones de compatibilidad PostgreSQL

El diseño original usa `STRING` en algunos campos. PostgreSQL/Supabase utiliza `TEXT`, por lo que esos campos se definieron como `TEXT`.

Además, `recordatorios.entrada_usuario_id` debe ser `BIGINT` porque referencia `entradas_usuario.id`, que es `BIGINT`.

## Datos que todavía dependen de otros contratos

El contrato actual de Entradas define `id_usuario`, `id_evento`, `nombre_evento`, `fecha_evento`, `cantidad_entradas` y `fecha_emision`. Por eso `email` y `codigo_qr` quedan como campos opcionales en la base y no se asume que ya vienen en el evento actual.

Los identificadores `usuario_id` y `evento_id` se almacenan como `TEXT` para permitir que el backend use identificadores numéricos o de otro formato sin modificar el esquema.
