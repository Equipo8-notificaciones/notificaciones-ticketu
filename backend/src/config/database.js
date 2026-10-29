
let pool;

function getPool() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error(
            'DATABASE_URL no está configurada; no se puede guardar la compra.'
        );
    }

    const { Pool } = require('pg');

    if (!pool) {
        const esSupabase = /supabase/i.test(databaseUrl);
        const usarSSL =
            process.env.DB_SSL === 'true' ||
            (process.env.DB_SSL !== 'false' && esSupabase);

        pool = new Pool({
            connectionString: databaseUrl,
            ssl: usarSSL
                ? { rejectUnauthorized: false }
                : undefined
        });

        pool.on('error', (error) => {
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
