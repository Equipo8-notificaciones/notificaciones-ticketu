const getPool = () => require('../config/database').getPool();

function createEventDeduplicationService(getDatabasePool = getPool) {
    const procesadosEnMemoria = new Set();
    const enProceso = new Map();

    async function procesarUnaVez(exchange, routingKey, evento, handler) {
        const eventId = String(evento?.event_id ?? '').trim();
        if (!eventId) {
            throw new Error(`El evento "${routingKey}" debe incluir un event_id único.`);
        }
        if (typeof handler !== 'function') {
            throw new Error('Se requiere un handler para procesar el evento.');
        }

        const clave = `${exchange}:${routingKey}:${eventId}`;
        const pool = getDatabasePool();
        if (pool) return procesarConBaseDatos(pool, clave, handler);
        return procesarEnMemoria(clave, handler);
    }

    async function procesarConBaseDatos(pool, clave, handler) {
        const client = await pool.connect();
        let bloqueoAdquirido = false;
        try {
            await client.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [clave]);
            bloqueoAdquirido = true;
            const existente = await client.query(
                `SELECT 1
                 FROM public.eventos_procesados
                 WHERE clave_evento = $1`,
                [clave]
            );
            if (existente.rowCount > 0) {
                console.info(`[eventDeduplication] Evento duplicado ignorado: ${clave}`);
                return { duplicado: true };
            }

            const resultado = await handler();
            await client.query(
                `INSERT INTO public.eventos_procesados (clave_evento)
                 VALUES ($1)`,
                [clave]
            );
            return { duplicado: false, resultado };
        } finally {
            try {
                if (bloqueoAdquirido) {
                    await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [clave]);
                }
            } finally {
                client.release();
            }
        }
    }

    async function procesarEnMemoria(clave, handler) {
        if (procesadosEnMemoria.has(clave)) {
            console.info(`[eventDeduplication] Evento duplicado ignorado: ${clave}`);
            return { duplicado: true };
        }

        const existente = enProceso.get(clave);
        if (existente) {
            await existente;
            console.info(`[eventDeduplication] Evento duplicado ignorado: ${clave}`);
            return { duplicado: true };
        }

        const trabajo = Promise.resolve().then(handler);
        enProceso.set(clave, trabajo);
        try {
            const resultado = await trabajo;
            procesadosEnMemoria.add(clave);
            return { duplicado: false, resultado };
        } finally {
            enProceso.delete(clave);
        }
    }

    return { procesarUnaVez };
}

module.exports = {
    ...createEventDeduplicationService(),
    createEventDeduplicationService
};
