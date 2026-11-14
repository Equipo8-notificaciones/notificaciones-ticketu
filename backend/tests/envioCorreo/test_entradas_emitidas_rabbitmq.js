const assert = require('node:assert/strict');
const { Pool } = require('pg');
const {
    abrirCanal,
    esperarMensaje,
    publicar
} = require('./_rabbitmqTestUtils');

const DATABASE_URL = process.env.DATABASE_URL;
const EMAIL = 'g.herreraosorio@gmail.com';

async function main() {
    assert.ok(DATABASE_URL, 'Falta DATABASE_URL para verificar la persistencia en Supabase.');
    const idUsuario = `usuario-entradas-${Date.now()}`;
    const idEvento = `evento-entradas-${Date.now()}`;
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || /supabase/i.test(DATABASE_URL)
            ? { rejectUnauthorized: false }
            : undefined
    });
    const { connection, channel } = await abrirCanal();

    try {
        const confirmacion = esperarMensaje(
            channel,
            'notificaciones.events',
            'notificaciones.confirmacion_envio'
        );
        await publicar(channel, 'entradas.events', 'entradas_emitidas', {
            correo_comprador: EMAIL,
            nombre_comprador: 'Comprador de Prueba',
            id_usuario: idUsuario,
            nombre_evento: 'Evento de Prueba de Integración',
            id_evento: idEvento,
            fecha_evento: '2030-01-15',
            hora_evento: '20:30',
            qr_data: `https://storage.example.com/qr/${idEvento}.png`
        });
        assert.deepEqual(await confirmacion, { estado: 'en_cola' });

        const resultado = await pool.query(
            `SELECT n.canal, e.estado_envio
             FROM public.notificacion n
             LEFT JOIN public.envios_notificacion e USING (id_notificacion)
             WHERE n.id_usuario = $1 AND n.datos->>'id_evento' = $2
             ORDER BY n.canal`,
            [idUsuario, idEvento]
        );
        assert.ok(resultado.rows.some(row => row.canal === 'APP'), 'No se guardó la notificación APP.');
        assert.ok(resultado.rows.some(row => row.canal === 'EMAIL'), 'No se guardó la notificación EMAIL.');
        assert.ok(resultado.rows.length >= 2, 'No se registraron los envíos esperados.');

        console.log(`OK: entradas_emitidas envió correo a ${EMAIL}.`);
        console.log(`OK: notificaciones APP/EMAIL persistidas para ${idUsuario}/${idEvento}.`);
    } finally {
        await channel.close().catch(() => {});
        await connection.close().catch(() => {});
        await pool.end();
    }
}

main().catch(error => {
    console.error(`FALLO en entradas_emitidas: ${error.message}`);
    process.exitCode = 1;
});
