let pool;

function getPool() {
    if (!process.env.DATABASE_URL) return null;

    const { Pool } = require('pg');

    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DB_SSL === 'true'
                ? { rejectUnauthorized: false }
                : undefined,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });

        pool.on('error', (error) => {
            console.error('[database] Error inesperado en el pool:', error.message);
        });
    }

    return pool;
}

async function testConnection() {
    const db = getPool();

    if (!db) {
        throw new Error('DATABASE_URL no está configurada. Crea un archivo .env con la conexión de Supabase.');
    }

    const { rows } = await db.query('SELECT NOW() AS fecha');
    return rows[0];
}

async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

module.exports = { getPool, testConnection, closePool };
