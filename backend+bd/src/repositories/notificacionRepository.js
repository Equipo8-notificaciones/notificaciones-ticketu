const IRepositorioNotificacion = require('../interfaces/IRepositorioNotificacion');
const { EstadosNotificacion } = require('../utils/notificacionEstados');
const { getPool } = require('../config/database');

//Repositorio encargado de guardar y buscar notificaciones

class NotificacionRepository extends IRepositorioNotificacion {
    constructor() {
        super();
        this.notificaciones = [];
    }

    usarPostgres() {
        return Boolean(getPool());
    }

    async save(notificacion) {
        const pool = getPool();

        if (!pool) {
            this.notificaciones.push(notificacion);
            return notificacion;
        }

        const query = `
            INSERT INTO notificaciones (
                id_notificacion, usuario_id, tipo, titulo, mensaje, datos,
                fecha_emision, estado, fecha_lectura, fecha_eliminacion,
                intentos_envio, error_envio
            )
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            notificacion.id_notificacion,
            notificacion.usuario_id,
            notificacion.tipo,
            notificacion.titulo,
            notificacion.mensaje,
            JSON.stringify(notificacion.datos ?? {}),
            notificacion.fecha_emision,
            notificacion.estado,
            notificacion.fecha_lectura,
            notificacion.fecha_eliminacion,
            notificacion.intentos_envio,
            notificacion.error_envio
        ];

        const { rows } = await pool.query(query, values);
        return this.mapRow(rows[0]);
    }

    async findById(id) {
        const pool = getPool();

        if (!pool) {
            return this.notificaciones.find(n => n.id_notificacion === id);
        }

        const { rows } = await pool.query(
            'SELECT * FROM notificaciones WHERE id_notificacion = $1 LIMIT 1',
            [id]
        );

        return rows[0] ? this.mapRow(rows[0]) : undefined;
    }

    async findByUsuario(usuarioId) {
        const pool = getPool();

        if (!pool) {
            return this.notificaciones
                .filter(n => n.usuario_id === usuarioId && n.estado !== EstadosNotificacion.ELIMINADA)
                .sort((a, b) => new Date(b.fecha_emision) - new Date(a.fecha_emision));
        }

        const { rows } = await pool.query(
            `SELECT *
             FROM notificaciones
             WHERE usuario_id = $1 AND estado <> $2
             ORDER BY fecha_emision DESC`,
            [usuarioId, EstadosNotificacion.ELIMINADA]
        );

        return rows.map(row => this.mapRow(row));
    }

    async findAll() {
        const pool = getPool();

        if (!pool) return [...this.notificaciones];

        const { rows } = await pool.query(
            'SELECT * FROM notificaciones ORDER BY fecha_emision DESC'
        );

        return rows.map(row => this.mapRow(row));
    }

    async update(notificacion) {
        const pool = getPool();

        if (!pool) {
            const index = this.notificaciones.findIndex(
                n => n.id_notificacion === notificacion.id_notificacion
            );

            if (index === -1) throw new Error('Notificación no encontrada');
            this.notificaciones[index] = notificacion;
            return notificacion;
        }

        const query = `
            UPDATE notificaciones
            SET usuario_id = $2,
                tipo = $3,
                titulo = $4,
                mensaje = $5,
                datos = $6::jsonb,
                fecha_emision = $7,
                estado = $8,
                fecha_lectura = $9,
                fecha_eliminacion = $10,
                intentos_envio = $11,
                error_envio = $12
            WHERE id_notificacion = $1
            RETURNING *
        `;

        const values = [
            notificacion.id_notificacion,
            notificacion.usuario_id,
            notificacion.tipo,
            notificacion.titulo,
            notificacion.mensaje,
            JSON.stringify(notificacion.datos ?? {}),
            notificacion.fecha_emision,
            notificacion.estado,
            notificacion.fecha_lectura,
            notificacion.fecha_eliminacion,
            notificacion.intentos_envio,
            notificacion.error_envio
        ];

        const { rows } = await pool.query(query, values);
        if (!rows[0]) throw new Error('Notificación no encontrada');
        return this.mapRow(rows[0]);
    }

    mapRow(row) {
        return {
            id_notificacion: row.id_notificacion,
            usuario_id: row.usuario_id,
            tipo: row.tipo,
            titulo: row.titulo,
            mensaje: row.mensaje,
            datos: row.datos ?? {},
            fecha_emision: row.fecha_emision,
            estado: row.estado,
            fecha_lectura: row.fecha_lectura,
            fecha_eliminacion: row.fecha_eliminacion,
            intentos_envio: row.intentos_envio,
            error_envio: row.error_envio
        };
    }
}

module.exports = new NotificacionRepository();
