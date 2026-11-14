require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../../.env') });

const assert = require('node:assert/strict');
const amqp = require('amqplib');
const { Pool } = require('pg');

const EXCHANGE_PANEL = 'panel.evento.notificaciones.v1';
const BROKER_URL = process.env.BROKER_URL || 'amqp://ticketu:ticketu_dev@localhost:5672';
const DATABASE_URL = process.env.DATABASE_URL;
const TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS || 45000);

function fechaEnDias(dias) {
    return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function crearEntradas(pool, idEvento, ids, fecha) {
    await pool.query(
        `INSERT INTO public.entradas_usuario
            (id_usuario, id_evento, correo_comprador, nombre_evento, fecha_evento, entrada_activa, estado_evento)
         VALUES
            ($1,$4,'a@example.com','Evento Panel de Prueba',$5::date + TIME '20:00',true,'PROGRAMADO'),
            ($2,$4,'b@example.com','Evento Panel de Prueba',$5::date + TIME '20:00',true,'PROGRAMADO'),
            ($3,$4,'c@example.com','Evento Panel de Prueba',$5::date + TIME '20:00',false,'PROGRAMADO')`,
        [ids[0], ids[1], ids[2], idEvento, fecha]
    );
}

async function publicar(channel, routingKey, evento) {
    channel.publish(EXCHANGE_PANEL, routingKey, Buffer.from(JSON.stringify(evento)), {
        contentType: 'application/json',
        persistent: true,
        mandatory: true
    });
    await channel.waitForConfirms();
}

async function esperarNotificaciones(pool, idEvento, idsEsperados) {
    const deadline = Date.now() + TIMEOUT_MS;
    let rows = [];
    while (Date.now() < deadline) {
        const result = await pool.query(
            `SELECT id_usuario, tipo, mensaje, datos
             FROM public.notificacion
             WHERE datos->>'id_evento'=$1
             ORDER BY id_notificacion`,
            [idEvento]
        );
        rows = result.rows;
        const recibidos = new Set(rows.map(row => row.id_usuario));
        if (idsEsperados.every(id => recibidos.has(id))) return rows;
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    throw new Error(`No aparecieron las notificaciones esperadas para ${idEvento}: ${JSON.stringify(rows)}`);
}

async function verificarEnvios(pool, idEvento) {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM public.envios_notificacion e
         JOIN public.notificacion n USING (id_notificacion)
         WHERE n.datos->>'id_evento'=$1`,
        [idEvento]
    );
    assert.ok(result.rows[0].total >= 3,
        `Deben registrarse al menos tres intentos de envío para ${idEvento}.`);
}

async function main() {
    assert.ok(DATABASE_URL, 'Falta DATABASE_URL. La prueba requiere Supabase PostgreSQL.');
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || /supabase/i.test(DATABASE_URL)
            ? { rejectUnauthorized: false } : undefined
    });
    let connection;
    let channel;
    const unique = `${Date.now()}-${process.pid}`;

    try {
        await pool.query('SELECT 1');
        connection = await amqp.connect(BROKER_URL);
        channel = await connection.createConfirmChannel();
        await channel.assertExchange(EXCHANGE_PANEL, 'topic', { durable: true });

        // Caso 1: cancelación. Deben recibirla solo las dos entradas activas.
        const idEventoCancelado = `evt-panel-cancel-${unique}`;
        const organizadorCancelacion = `staff-panel-cancel-${unique}`;
        const asistentesCancelacion = [
            `usr-panel-cancel-a-${unique}`,
            `usr-panel-cancel-b-${unique}`,
            `usr-panel-cancel-inactivo-${unique}`
        ];
        await crearEntradas(pool, idEventoCancelado, asistentesCancelacion, fechaEnDias(7));
        await publicar(channel, 'evento_actualizado', {
            id_evento: idEventoCancelado,
            id_usuario: organizadorCancelacion,
            nuevo_estado: 'cancelado'
        });

        const notificacionesCancelacion = await esperarNotificaciones(
            pool, idEventoCancelado, [...asistentesCancelacion.slice(0, 2), organizadorCancelacion]
        );
        const cancelacionPorUsuario = new Map(notificacionesCancelacion.map(row => [row.id_usuario, row]));
        for (const id of asistentesCancelacion.slice(0, 2)) {
            assert.equal(cancelacionPorUsuario.get(id)?.tipo, 'CANCELACION_EVENTO');
        }
        assert.equal(cancelacionPorUsuario.has(asistentesCancelacion[2]), false,
            'La entrada inactiva no debe recibir notificación de cancelación.');
        assert.match(cancelacionPorUsuario.get(organizadorCancelacion).mensaje,
            /El envío se realizó correctamente/);
        const estadoCancelacion = await pool.query(
            'SELECT DISTINCT estado_evento FROM public.entradas_usuario WHERE id_evento=$1',
            [idEventoCancelado]
        );
        assert.deepEqual(estadoCancelacion.rows.map(row => row.estado_evento), ['CANCELADO']);
        await verificarEnvios(pool, idEventoCancelado);

        // Caso 2: reprogramación. Comprueba que la nueva fecha se persiste y se notifica.
        const idEventoReprogramado = `evt-panel-reprogramado-${unique}`;
        const organizadorReprogramacion = `staff-panel-reprogramado-${unique}`;
        const asistentesReprogramacion = [
            `usr-panel-reprogramado-a-${unique}`,
            `usr-panel-reprogramado-b-${unique}`,
            `usr-panel-reprogramado-inactivo-${unique}`
        ];
        const nuevaFecha = fechaEnDias(10);
        const nuevaHora = '21:30:00';
        await crearEntradas(pool, idEventoReprogramado, asistentesReprogramacion, fechaEnDias(7));
        await publicar(channel, 'evento_reprogramado', {
            id_evento: idEventoReprogramado,
            id_usuario: organizadorReprogramacion,
            nuevo_estado: 'publicado',
            fecha_cambio: nuevaFecha,
            hora_cambio: nuevaHora
        });

        const notificacionesReprogramacion = await esperarNotificaciones(
            pool, idEventoReprogramado, [...asistentesReprogramacion.slice(0, 2), organizadorReprogramacion]
        );
        const reprogramacionPorUsuario = new Map(notificacionesReprogramacion.map(row => [row.id_usuario, row]));
        for (const id of asistentesReprogramacion.slice(0, 2)) {
            assert.equal(reprogramacionPorUsuario.get(id)?.tipo, 'CAMBIO_EVENTO');
            assert.match(reprogramacionPorUsuario.get(id).mensaje, new RegExp(nuevaFecha));
        }
        assert.equal(reprogramacionPorUsuario.has(asistentesReprogramacion[2]), false,
            'La entrada inactiva no debe recibir notificación de reprogramación.');
        assert.match(reprogramacionPorUsuario.get(organizadorReprogramacion).mensaje,
            /El envío se realizó correctamente/);

        const fechasActualizadas = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM public.entradas_usuario
             WHERE id_evento=$1
               AND (fecha_evento AT TIME ZONE 'UTC')::date = $2::date
               AND (fecha_evento AT TIME ZONE 'UTC')::time = $3::time`,
            [idEventoReprogramado, nuevaFecha, nuevaHora]
        );
        assert.equal(fechasActualizadas.rows[0].total, 3,
            'La fecha y hora nuevas deben persistirse para todas las entradas del evento.');
        await verificarEnvios(pool, idEventoReprogramado);

        console.log('OK: Panel publicó evento_actualizado y evento_reprogramado.');
        console.log('OK: la cancelación llegó solo a asistentes con entradas activas y actualizó estado_evento.');
        console.log('OK: la reprogramación llegó solo a asistentes activos y actualizó fecha_evento.');
        console.log('OK: el organizador recibió "El envío se realizó correctamente" en ambos casos.');
        console.log(`IDs de prueba: cancelación=${idEventoCancelado}, reprogramación=${idEventoReprogramado}`);
    } finally {
        if (channel) await channel.close().catch(() => {});
        if (connection) await connection.close().catch(() => {});
        await pool.end();
    }
}

main().catch(error => {
    console.error('FALLO en integración Panel:', error.message);
    process.exitCode = 1;
});
