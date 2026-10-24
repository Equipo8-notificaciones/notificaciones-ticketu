const { getPool } = require('../config/database');

function exigirBaseDatos() {
    const pool = getPool();
    if (!pool) throw new Error('DATABASE_URL no está configurada; se necesita la base de datos para consultar las entradas activas.');
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

async function obtenerFechaEvento(idEvento) {
    const pool = exigirBaseDatos();
    const { rows } = await pool.query(
        `SELECT fecha_evento, fecha_evento > CURRENT_TIMESTAMP AS es_futuro
         FROM public.entradas_usuario
         WHERE id_evento = $1
         ORDER BY fecha_evento DESC
         LIMIT 1`, [String(idEvento)]
    );
    if (rows.length === 0) {
        throw new Error(`No se encontró fecha_evento en la base de datos para el evento ${idEvento}.`);
    }
    return rows[0];
}

async function marcarEventoCancelado(idEvento) {
    const pool = exigirBaseDatos();
    const { rows, rowCount } = await pool.query(
        `UPDATE public.entradas_usuario
         SET estado_evento = 'CANCELADO', updated_at = NOW()
         WHERE id_evento = $1
         RETURNING id_usuario, estado_evento`,
        [String(idEvento)]
    );

    if (rowCount === 0) {
        throw new Error(`No se pudo cancelar el evento ${idEvento}: no hay entradas asociadas en la base de datos.`);
    }
    if (rows.length !== rowCount || rows.some(row => row.estado_evento !== 'CANCELADO')) {
        throw new Error(`No se pudo verificar la cancelación en todas las entradas del evento ${idEvento}.`);
    }
    return rows;
}

async function obtenerEstadoRecordatorio(idUsuario, idEvento) {
    const pool = exigirBaseDatos();
    const { rows } = await pool.query(
        `SELECT estado_evento, fecha_evento > CURRENT_TIMESTAMP AS evento_futuro
         FROM public.entradas_usuario
         WHERE id_usuario = $1 AND id_evento = $2
         LIMIT 1`,
        [String(idUsuario), String(idEvento)]
    );
    if (rows.length === 0) {
        throw new Error(`No se pudo verificar el estado del recordatorio: no existe la entrada del usuario ${idUsuario} para el evento ${idEvento}.`);
    }
    return rows[0];
}

async function actualizarFechaEvento(idEvento, fechaEvento, horaEvento) {
    const pool = exigirBaseDatos();
    const { rows, rowCount } = await pool.query(
        `UPDATE public.entradas_usuario
         SET fecha_evento = ($2::date + $3::time), updated_at = NOW()
         WHERE id_evento = $1 AND ($2::date + $3::time) > CURRENT_TIMESTAMP
         RETURNING id_usuario, nombre_evento, entrada_activa, fecha_evento,
                   fecha_evento = ($2::date + $3::time) AS fecha_actualizada`,
        [String(idEvento), fechaEvento, horaEvento]
    );

    if (rowCount === 0) {
        throw new Error(`No se actualizó fecha_evento para el evento ${idEvento}; compruebe que tenga entradas y que la nueva fecha sea futura.`);
    }
    if (rows.length !== rowCount || rows.some(row => row.fecha_actualizada !== true)) {
        throw new Error(`No se pudo verificar la actualización de fecha_evento para todas las entradas del evento ${idEvento}.`);
    }
    return rows;
}

module.exports = {
    obtenerUsuariosConEntradasActivas,
    obtenerFechaEvento,
    actualizarFechaEvento,
    marcarEventoCancelado,
    obtenerEstadoRecordatorio
};
