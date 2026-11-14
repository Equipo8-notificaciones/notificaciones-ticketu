let pool;

function getPool() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl || !databaseUrl.trim()) {
        // El repositorio en memoria solo se habilita dentro de las pruebas unitarias.
        // En ejecución normal y en integración, la base de datos es obligatoria.
        if (process.env.NODE_ENV === 'test') return null;
        throw new Error('DATABASE_URL no está configurada; Notificaciones requiere Supabase PostgreSQL.');
    }

    let parsed;
    try {
        parsed = new URL(databaseUrl);
    } catch {
        throw new Error('DATABASE_URL no es una URL PostgreSQL válida.');
    }
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
        throw new Error('DATABASE_URL debe utilizar el protocolo PostgreSQL.');
    }

    const { Pool } = require('pg');
    if (!pool) {
        const esSupabase = parsed.hostname.endsWith('.supabase.co') ||
            parsed.hostname.includes('.pooler.supabase.com');
        const usarSSL = process.env.DB_SSL === 'true' ||
            (process.env.DB_SSL !== 'false' && esSupabase);

        pool = new Pool({
            connectionString: databaseUrl,
            ssl: usarSSL ? { rejectUnauthorized: false } : undefined,
            max: Number(process.env.DB_POOL_MAX || 10),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000)
        });
        pool.on('error', error => {
            console.error('[database] Error inesperado del pool:', error.message);
        });
    }
    return pool;
}

async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

module.exports = { getPool, closePool };
