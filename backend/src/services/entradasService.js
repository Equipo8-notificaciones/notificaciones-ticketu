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

module.exports = { obtenerUsuariosConEntradasActivas };
