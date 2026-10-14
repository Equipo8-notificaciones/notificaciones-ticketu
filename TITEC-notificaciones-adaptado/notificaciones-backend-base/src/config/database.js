let pool;

function getPool() {
    if (!process.env.DATABASE_URL) return null;

    // pg se carga solamente cuando realmente se configure PostgreSQL.
    const { Pool } = require('pg');

    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
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
