const { getPool } = require('../config/database');

function exigirBaseDatos() {
    const pool = getPool();
    if (!pool) throw new Error('DATABASE_URL no está configurada; PANEL necesita Supabase para actualizar entradas.');
    return pool;
}

async function obtenerUsuariosConEntradasActivas(idEvento) {
    const pool = exigirBaseDatos();
    const { rows } = await pool.query(
        `SELECT id_usuario, correo_comprador, nombre_evento, fecha_evento, estado_evento
         FROM public.entradas_usuario
         WHERE id_evento = $1 AND entrada_activa = TRUE
         ORDER BY id_usuario`, [String(idEvento)]
    );
    return rows;
}

/*async function reprogramarEvento(idEvento, nuevaFechaEvento) {
    const pool = exigirBaseDatos();
    const { rows } = await pool.query(
        `UPDATE public.entradas_usuario
         SET fecha_evento = $2::timestamptz,
             estado_evento = 'REPROGRAMADO',
             updated_at = NOW()
         WHERE id_evento = $1
         RETURNING id_usuario, id_evento, correo_comprador, nombre_evento, fecha_evento, entrada_activa, estado_evento`,
        [String(idEvento), nuevaFechaEvento]
    );
    if (!rows.length) throw new Error(`No se encontraron entradas para el evento ${idEvento}.`);
    return rows;
}*/

async function reprogramarEvento(idEvento, nuevaFechaEvento) {
    const pool = exigirBaseDatos();

    const { rows } = await pool.query(
        `WITH anteriores AS MATERIALIZED (
            SELECT
                id_entradas_usuario,
                fecha_evento AS fecha_anterior
            FROM public.entradas_usuario
            WHERE id_evento = $1
        )
        UPDATE public.entradas_usuario AS eu
        SET fecha_evento = $2::timestamptz,
            estado_evento = 'REPROGRAMADO',
            updated_at = NOW()
        FROM anteriores AS a
        WHERE eu.id_entradas_usuario = a.id_entradas_usuario
        RETURNING
            eu.id_entradas_usuario,
            eu.id_usuario,
            eu.id_evento,
            eu.correo_comprador,
            eu.nombre_evento,
            a.fecha_anterior,
            eu.fecha_evento,
            eu.entrada_activa,
            eu.estado_evento,
            eu.updated_at`,
        [String(idEvento), nuevaFechaEvento]
    );

    if (!rows.length) {
        throw new Error(
            `No se encontraron entradas para el evento ${idEvento}.`
        );
    }

    return rows;
}


async function cancelarEvento(idEvento) {
    const pool = exigirBaseDatos();
    const { rows } = await pool.query(
        `UPDATE public.entradas_usuario
         SET estado_evento = 'CANCELADO', updated_at = NOW()
         WHERE id_evento = $1
         RETURNING id_usuario, id_evento, correo_comprador, nombre_evento, fecha_evento, entrada_activa, estado_evento`,
        [String(idEvento)]
    );
    if (!rows.length) throw new Error(`No se encontraron entradas para el evento ${idEvento}.`);
    return rows;
}

module.exports = { obtenerUsuariosConEntradasActivas, reprogramarEvento, cancelarEvento };
