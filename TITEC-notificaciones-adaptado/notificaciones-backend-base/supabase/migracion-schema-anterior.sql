-- MIGRACION desde el schema que venia en versiones anteriores del ZIP.
-- Ejecutar una sola vez en Supabase si public.notificacion todavia usa "titulo"
-- y public.envios_notificacion todavia contiene la columna "canal".
BEGIN;

-- En las versiones anteriores, "titulo" guardaba realmente el tipo de notificacion.
ALTER TABLE IF EXISTS public.notificacion DROP CONSTRAINT IF EXISTS check_notificacion_titulo;
DO $$
BEGIN
    IF to_regclass('public.notificacion') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'notificacion' AND column_name = 'titulo'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'notificacion' AND column_name = 'tipo'
        ) THEN
            ALTER TABLE public.notificacion RENAME COLUMN titulo TO tipo;
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'notificacion' AND column_name = 'titulo'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'notificacion' AND column_name = 'tipo'
        ) THEN
            EXECUTE 'UPDATE public.notificacion SET tipo = COALESCE(tipo, titulo)';
            ALTER TABLE public.notificacion DROP COLUMN titulo;
        END IF;
    END IF;
END $$;

ALTER TABLE IF EXISTS public.notificacion ADD COLUMN IF NOT EXISTS canal TEXT;
UPDATE public.notificacion SET canal = 'APP' WHERE canal IS NULL;
ALTER TABLE IF EXISTS public.notificacion ALTER COLUMN canal SET NOT NULL;
ALTER TABLE IF EXISTS public.notificacion DROP CONSTRAINT IF EXISTS check_notificacion_tipo;
ALTER TABLE IF EXISTS public.notificacion ADD CONSTRAINT check_notificacion_tipo
    CHECK (tipo IN (
        'COMPRA', 'RECORDATORIO', 'RECORDATORIO_24H', 'RECORDATORIO_30M',
        'INICIO_EVENTO', 'EVENTO_CAMBIO', 'CAMBIO_EVENTO', 'CANCELACION_EVENTO',
        'RECUPERACION_PASSWORD', 'CREACION_STAFF'
    ));
ALTER TABLE IF EXISTS public.notificacion DROP CONSTRAINT IF EXISTS check_notificacion_canal;
ALTER TABLE IF EXISTS public.notificacion ADD CONSTRAINT check_notificacion_canal CHECK (canal IN ('APP', 'EMAIL'));

-- En la version anterior el canal estaba en envios_notificacion; ahora el canal
-- pertenece a notificacion, segun el schema definitivo.
ALTER TABLE IF EXISTS public.envios_notificacion DROP CONSTRAINT IF EXISTS check_envios_canal;
ALTER TABLE IF EXISTS public.envios_notificacion DROP COLUMN IF EXISTS canal;
ALTER TABLE IF EXISTS public.envios_notificacion DROP CONSTRAINT IF EXISTS check_envios_estado;
ALTER TABLE IF EXISTS public.envios_notificacion ADD CONSTRAINT check_envios_estado
    CHECK (estado_envio IN ('PENDIENTE', 'ENVIADO', 'ERROR'));

CREATE INDEX IF NOT EXISTS idx_entradas_usuario ON public.entradas_usuario(id_usuario);
CREATE INDEX IF NOT EXISTS idx_entradas_evento ON public.entradas_usuario(id_evento);
CREATE INDEX IF NOT EXISTS idx_entradas_fecha_evento ON public.entradas_usuario(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_notificacion_usuario ON public.notificacion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificacion_no_leidas ON public.notificacion(id_usuario) WHERE estado_lectura = 'NO_LEIDA';
CREATE INDEX IF NOT EXISTS idx_envios_notificacion ON public.envios_notificacion(id_notificacion);

COMMIT;
