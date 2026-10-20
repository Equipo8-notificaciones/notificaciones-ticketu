const { getPool } = require('../config/database');

const memoriaNotificaciones = [];
const memoriaEnvios = [];
let siguienteIdNotificacion = 1;
let siguienteIdEnvio = 1;

class NotificacionRepository {
    async save(n) {
        const pool = getPool();
        if (!pool) {
            const guardada = {
                ...n,
                id_notificacion: n.id_notificacion ?? siguienteIdNotificacion++,
                created_at: n.created_at || new Date().toISOString()
            };
            memoriaNotificaciones.push(guardada);
            return this.mapRow(guardada);
        }

        const query = `
            INSERT INTO public.notificacion
                (id_usuario, tipo, mensaje, datos, estado_lectura, fecha_eliminacion, canal)
            VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
            RETURNING *`;
        const { rows } = await pool.query(query, [
            n.id_usuario ?? n.usuario_id,
            n.tipo,
            n.mensaje,
            JSON.stringify(n.datos || {}),
            n.estado_lectura || 'NO_LEIDA',
            n.fecha_eliminacion || null,
            n.canal || 'APP'
        ]);
        return this.mapRow(rows[0]);
    }

    async findById(id) {
        const pool = getPool();
        if (!pool) {
            const row = memoriaNotificaciones.find(n => String(n.id_notificacion) === String(id));
            return row ? this.mapRow(row) : undefined;
        }
        const { rows } = await pool.query(
            'SELECT * FROM public.notificacion WHERE id_notificacion = $1', [id]
        );
        return rows[0] ? this.mapRow(rows[0]) : undefined;
    }

    async findByUsuario(usuarioId) {
        const pool = getPool();
        if (!pool) {
            return memoriaNotificaciones
                .filter(n => String(n.id_usuario ?? n.usuario_id) === String(usuarioId) && !n.fecha_eliminacion && n.estado_lectura !== 'ELIMINADA')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(n => this.mapRow(n));
        }
        const { rows } = await pool.query(
            `SELECT *
             FROM public.notificacion
             WHERE id_usuario = $1
             AND canal = 'APP'
             AND fecha_eliminacion IS NULL
             AND estado_lectura <> 'ELIMINADA'
             ORDER BY created_at DESC`, 
             [usuarioId]
        );
        return rows.map(row => this.mapRow(row));
    }

    async findAll() {
        const pool = getPool();
        if (!pool) {
            return [...memoriaNotificaciones]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(n => this.mapRow(n));
        }
        const { rows } = await pool.query('SELECT * FROM public.notificacion ORDER BY created_at DESC');
        return rows.map(row => this.mapRow(row));
    }

    async update(n) {
        const pool = getPool();
        if (!pool) {
            const index = memoriaNotificaciones.findIndex(x => String(x.id_notificacion) === String(n.id_notificacion));
            if (index < 0) throw new Error('Notificación no encontrada');
            memoriaNotificaciones[index] = { ...memoriaNotificaciones[index], ...n };
            return this.mapRow(memoriaNotificaciones[index]);
        }
        const { rows } = await pool.query(
            `UPDATE public.notificacion
             SET estado_lectura = $2, fecha_eliminacion = $3
             WHERE id_notificacion = $1 RETURNING *`,
            [n.id_notificacion, n.estado_lectura, n.fecha_eliminacion || null]
        );
        if (!rows[0]) throw new Error('Notificación no encontrada');
        return this.mapRow(rows[0]);
    }

    async softDelete(id) {
        const pool = getPool();
        const { rows } = await pool.query(
            `UPDATE public.notificacion
            SET estado_lectura = 'ELIMINADA',
                fecha_eliminacion = COALESCE(fecha_eliminacion, NOW())
            WHERE id_notificacion = $1
            RETURNING *`,
            [id]
        );

        if (!rows[0]) throw new Error('Notificación no encontrada');

        return this.mapRow(rows[0]);
    }

    async crearIntentoEnvio(idNotificacion, intento) {
        const pool = getPool();
        if (!pool) {
            const envio = {
                id_envio: siguienteIdEnvio++,
                id_notificacion: idNotificacion,
                estado_envio: 'PENDIENTE',
                intento,
                error: null,
                created_at: new Date().toISOString()
            };
            memoriaEnvios.push(envio);
            return { ...envio };
        }
        const { rows } = await pool.query(
            `INSERT INTO public.envios_notificacion (id_notificacion, estado_envio, intento, error)
             VALUES ($1, 'PENDIENTE', $2, NULL) RETURNING *`,
            [idNotificacion, intento]
        );
        return rows[0];
    }

    async finalizarIntentoEnvio(idEnvio, estadoEnvio, error = null) {
        const pool = getPool();
        if (!pool) {
            const index = memoriaEnvios.findIndex(e => String(e.id_envio) === String(idEnvio));
            if (index < 0) throw new Error('Intento de envío no encontrado');
            memoriaEnvios[index] = {
                ...memoriaEnvios[index],
                estado_envio: estadoEnvio,
                error: error ? String(error).slice(0, 4000) : null
            };
            return { ...memoriaEnvios[index] };
        }
        const { rows } = await pool.query(
            `UPDATE public.envios_notificacion SET estado_envio = $2, error = $3
             WHERE id_envio = $1 RETURNING *`,
            [idEnvio, estadoEnvio, error ? String(error).slice(0, 4000) : null]
        );
        if (!rows[0]) throw new Error('Intento de envío no encontrado');
        return rows[0];
    }

    async findEnviosByNotificacion(idNotificacion) {
        const pool = getPool();
        if (!pool) return memoriaEnvios.filter(e => String(e.id_notificacion) === String(idNotificacion));
        
        const { rows } = await pool.query(
            `SELECT * FROM public.envios_notificacion
             WHERE id_notificacion = $1 ORDER BY intento ASC, id_envio ASC`,
            [idNotificacion]
        );
        return rows;
    }

    mapRow(row) {
        const tipo = row.tipo ?? row.titulo;
        return {
            id_notificacion: row.id_notificacion,
            id_usuario: row.id_usuario ?? row.usuario_id,
            usuario_id: row.id_usuario ?? row.usuario_id,
            tipo,
            titulo: tipo, // alias de compatibilidad para el HTML/API anteriores
            mensaje: row.mensaje,
            datos: row.datos || {},
            estado_lectura: row.estado_lectura || 'NO_LEIDA',
            estado: row.estado_lectura || 'NO_LEIDA',
            fecha_eliminacion: row.fecha_eliminacion ?? null,
            canal: row.canal || 'APP',
            created_at: row.created_at || new Date().toISOString(),
            fecha_emision: row.created_at || new Date().toISOString()
        };
    }
}

module.exports = new NotificacionRepository();
