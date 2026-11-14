require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../../.env') });
const assert = require('node:assert/strict');
const amqp = require('amqplib');
const { Pool } = require('pg');

const EXCHANGE_ENTRADAS = 'entradas.events';
const ROUTING_KEY_ENTRADAS = 'entradas_emitidas';
const EXCHANGE_CONFIRMACION = 'notificaciones.events';
const ROUTING_KEY_CONFIRMACION = 'notificaciones.confirmacion_envio';
const BROKER_URL = process.env.BROKER_URL || 'amqp://ticketu:ticketu_dev@localhost:5672';
const DATABASE_URL = process.env.DATABASE_URL;
const TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS || 45000);

function exigirConfiguracion() {
    assert.ok(DATABASE_URL, 'Falta DATABASE_URL. La prueba requiere la base Supabase real.');
}

function fechaEventoDePrueba() {
    const fecha = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const pad = value => String(value).padStart(2, '0');
    return {
        fecha_evento: `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`,
        hora_evento: '20:30'
    };
}

async function esperarConfirmacion(channel, queue) {
    let consumerTag;
    try {
        return await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(
                `No llegó la confirmación ${EXCHANGE_CONFIRMACION}/${ROUTING_KEY_CONFIRMACION} en ${TIMEOUT_MS} ms.`
            )), TIMEOUT_MS);
            channel.consume(queue, message => {
                if (!message) return;
                let payload;
                try { payload = JSON.parse(message.content.toString('utf8')); }
                catch { channel.ack(message); return; }
                channel.ack(message);
                if (payload?.estado === 'en_cola') {
                    clearTimeout(timer);
                    resolve(payload);
                }
            }, { noAck: false }).then(result => { consumerTag = result.consumerTag; })
                .catch(error => { clearTimeout(timer); reject(error); });
        });
    } finally {
        if (consumerTag) await channel.cancel(consumerTag).catch(() => {});
    }
}

async function esperarPersistencia(pool, idUsuario, idEvento) {
    const deadline = Date.now() + TIMEOUT_MS;
    let ultimoResultado;
    while (Date.now() < deadline) {
        const entradas = await pool.query(
            'SELECT id_usuario, id_evento FROM public.entradas_usuario WHERE id_usuario=$1 AND id_evento=$2',
            [idUsuario, idEvento]
        );
        const notificaciones = await pool.query(
            `SELECT id_notificacion, canal, tipo
             FROM public.notificacion
             WHERE id_usuario=$1 AND datos->>'id_evento'=$2
             ORDER BY id_notificacion`,
            [idUsuario, idEvento]
        );
        const envios = await pool.query(
            `SELECT e.id_envio, e.estado_envio, e.intento, n.canal
             FROM public.envios_notificacion e
             JOIN public.notificacion n USING (id_notificacion)
             WHERE n.id_usuario=$1 AND n.datos->>'id_evento'=$2
             ORDER BY n.canal, e.intento`,
            [idUsuario, idEvento]
        );
        ultimoResultado = { entradas: entradas.rows, notificaciones: notificaciones.rows, envios: envios.rows };
        if (entradas.rowCount === 1 &&
            notificaciones.rows.some(n => n.canal === 'APP') &&
            notificaciones.rows.some(n => n.canal === 'EMAIL') &&
            envios.rowCount >= 2) return ultimoResultado;
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    throw new Error(`No se persistieron todos los efectos de compra en Supabase: ${JSON.stringify(ultimoResultado)}`);
}

async function main() {
    exigirConfiguracion();
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || /supabase/i.test(DATABASE_URL)
            ? { rejectUnauthorized: false } : undefined
    });
    let connection;
    let channel;
    const unique = `${Date.now()}-${process.pid}`;
    const idUsuario = `usr-test-notificaciones-${unique}`;
    const idEvento = `evt-test-notificaciones-${unique}`;
    const fecha = fechaEventoDePrueba();
    const eventoCompra = {
        correo_comprador: process.env.TEST_EMAIL_DESTINO || 'prueba@example.com',
        nombre_comprador: 'Comprador de Prueba',
        id_usuario: idUsuario,
        nombre_evento: 'Concierto de Prueba TicketU',
        id_evento: idEvento,
        fecha_evento: fecha.fecha_evento,
        hora_evento: fecha.hora_evento,
        qr_data: `https://storage.example.com/qr/test-${unique}.png`
    };

    try {
        await pool.query('SELECT 1');
        connection = await amqp.connect(BROKER_URL);
        channel = await connection.createConfirmChannel();
        await channel.assertExchange(EXCHANGE_ENTRADAS, 'topic', { durable: true });
        await channel.assertExchange(EXCHANGE_CONFIRMACION, 'topic', { durable: true });
        const { queue } = await channel.assertQueue('', { durable: false, exclusive: true, autoDelete: true });
        await channel.bindQueue(queue, EXCHANGE_CONFIRMACION, ROUTING_KEY_CONFIRMACION);
        const confirmationPromise = esperarConfirmacion(channel, queue);

        channel.publish(EXCHANGE_ENTRADAS, ROUTING_KEY_ENTRADAS,
            Buffer.from(JSON.stringify(eventoCompra)), {
                contentType: 'application/json', persistent: true, mandatory: true
            });
        await channel.waitForConfirms();

        const confirmation = await confirmationPromise;
        assert.deepEqual(confirmation, { estado: 'en_cola' },
            'Entradas debe recibir confirmación de encolamiento, no una falsa confirmación de entrega.');

        const persisted = await esperarPersistencia(pool, idUsuario, idEvento);
        assert.equal(persisted.entradas.length, 1, 'La compra debe registrarse en entradas_usuario.');
        assert.deepEqual(persisted.notificaciones.map(n => n.canal).sort(), ['APP', 'EMAIL']);
        assert.ok(persisted.envios.length >= 2, 'Deben registrarse los intentos de envío en envios_notificacion.');

        console.log('OK: evento entradas_emitidas recibido por RabbitMQ.');
        console.log('OK: entrada_usuario persistida en Supabase.');
        console.log('OK: notificaciones APP y EMAIL persistidas.');
        console.log(`OK: ${persisted.envios.length} intento(s) de envío registrados en envios_notificacion.`);
        console.log(`IDs de prueba: usuario=${idUsuario}, evento=${idEvento}`);
    } finally {
        if (channel) await channel.close().catch(() => {});
        if (connection) await connection.close().catch(() => {});
        await pool.end();
    }
}

main().catch(error => {
    console.error('FALLO en integración de compra:', error.message);
    process.exitCode = 1;
});
