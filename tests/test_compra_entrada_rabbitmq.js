/*
 * Simula el mensaje que Entradas debe publicar después de emitir una entrada.
 * No importa ni modifica el microservicio Entradas; reproduce su contrato v3:
 * exchange `entradas.events`, routing key `entradas_emitidas`.
 *
 * Requiere ejecutarse dentro de la red Docker de Notificaciones, con RabbitMQ
 * y el consumidor de Notificaciones activos.
 */
const assert = require('node:assert/strict');
const amqp = require('amqplib');

const EXCHANGE_ENTRADAS = 'entradas.events';
const ROUTING_KEY_ENTRADAS = 'entradas_emitidas';
const EXCHANGE_CONFIRMACION = 'notificaciones.confirmacion_envio';
const ROUTING_KEY_CONFIRMACION = 'notificaciones.confirmacion_envio';
const BROKER_URL = process.env.BROKER_URL || 'amqp://ticketu:ticketu_dev@rabbitmq:5672';
const NOTIFICACIONES_URL = process.env.NOTIFICACIONES_URL || 'http://notificaciones:3000';
const TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS || 30000);

function fechaEventoDePrueba() {
    // Tres días a futuro para no disparar inmediatamente el recordatorio de 24 horas.
    const fecha = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const pad = valor => String(valor).padStart(2, '0');
    return {
        fecha_evento: `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`,
        hora_evento: '20:30'
    };
}

async function esperarConfirmacion(channel, queue, timeoutMs) {
    let consumerTag;
    let timer;
    try {
        return await new Promise((resolve, reject) => {
            timer = setTimeout(() => {
                reject(new Error(
                    `No llegó confirmación al exchange ${EXCHANGE_CONFIRMACION} en ${timeoutMs} ms. ` +
                    'Revisa los logs del contenedor notificaciones y la conexión a RabbitMQ.'
                ));
            }, timeoutMs);

            channel.consume(queue, (message) => {
                if (!message) return;
                let payload;
                try {
                    payload = JSON.parse(message.content.toString('utf8'));
                } catch (error) {
                    channel.ack(message);
                    return;
                }
                channel.ack(message);
                if (payload && typeof payload.estado === 'string' && typeof payload.mensaje === 'string') {
                    clearTimeout(timer);
                    resolve(payload);
                }
            }, { noAck: false }).then(result => {
                consumerTag = result.consumerTag;
            }).catch(error => {
                clearTimeout(timer);
                reject(error);
            });
        });
    } finally {
        clearTimeout(timer);
        if (consumerTag) {
            await channel.cancel(consumerTag).catch(() => {});
        }
    }
}

async function comprobarNotificacionApp(idUsuario, idEvento, timeoutMs) {
    const url = `${NOTIFICACIONES_URL}/api/notificaciones?usuarioId=${encodeURIComponent(idUsuario)}`;
    const limite = Date.now() + timeoutMs;
    let ultimoError;

    while (Date.now() < limite) {
        try {
            const response = await fetch(url);
            assert.equal(response.ok, true, `La API de Notificaciones respondió HTTP ${response.status}`);
            const lista = await response.json();
            assert.ok(Array.isArray(lista), 'El centro de notificaciones debe devolver un arreglo');
            const compra = lista.find(n =>
                n.tipo === 'COMPRA' && String(n.datos?.id_evento) === String(idEvento)
            );
            if (compra) return compra;
        } catch (error) {
            ultimoError = error;
        }
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    throw new Error(
        `No se encontró la notificación APP de la compra ${idEvento}. ` +
        (ultimoError ? `Último error: ${ultimoError.message}` : 'El consumidor no guardó una notificación para el usuario de prueba.')
    );
}

async function main() {
    let connection;
    let channel;
    const unique = `${Date.now()}-${process.pid}`;
    const idUsuario = `usr-test-notificaciones-${unique}`;
    const idEvento = `evt-test-notificaciones-${unique}`;
    const fecha = fechaEventoDePrueba();

    // Replica las ocho propiedades publicadas por NotificacionesService en Entradas.
    const eventoCompra = {
        correo_comprador: 'temoomet1234@gmail.com',
        nombre_comprador: 'Comprador de Prueba',
        id_usuario: idUsuario,
        nombre_evento: 'Concierto de Prueba TicketU2',
        id_evento: idEvento,
        fecha_evento: fecha.fecha_evento,
        hora_evento: fecha.hora_evento,
        qr_data: `https://storage.midominio.com/qr/test-${unique}.png`
    };

    try {
        console.log('[TEST] Conectando al RabbitMQ del entorno Docker...');
        connection = await amqp.connect(BROKER_URL);
        channel = await connection.createConfirmChannel();
        await channel.assertExchange(EXCHANGE_ENTRADAS, 'topic', { durable: true });
        await channel.assertExchange(EXCHANGE_CONFIRMACION, 'topic', { durable: true });

        // Cola temporal: recibe la confirmación que publica Notificaciones tras procesar la compra.
        const { queue } = await channel.assertQueue('', {
            durable: false,
            exclusive: true,
            autoDelete: true
        });
        await channel.bindQueue(queue, EXCHANGE_CONFIRMACION, ROUTING_KEY_CONFIRMACION);
        const confirmationPromise = esperarConfirmacion(channel, queue, TIMEOUT_MS);

        console.log(`[TEST] Publicando compra simulada: ${idEvento}`);
        channel.publish(
            EXCHANGE_ENTRADAS,
            ROUTING_KEY_ENTRADAS,
            Buffer.from(JSON.stringify(eventoCompra), 'utf8'),
            { contentType: 'application/json', persistent: true, mandatory: true }
        );
        await channel.waitForConfirms();

        const confirmacion = await confirmationPromise;
        assert.ok(['enviado', 'error'].includes(confirmacion.estado), 'La confirmación debe informar el estado de procesamiento');
        assert.ok(confirmacion.mensaje, 'La confirmación debe incluir un mensaje');

        const notificacion = await comprobarNotificacionApp(idUsuario, idEvento, TIMEOUT_MS);
        assert.equal(notificacion.tipo, 'COMPRA');
        assert.equal(String(notificacion.id_usuario), idUsuario);
        assert.equal(String(notificacion.datos.id_evento), idEvento);

        console.log('\n[OK] Notificaciones recibió el evento de compra por RabbitMQ.');
        console.log(`[OK] Notificación APP creada: ${notificacion.id_notificacion} (${notificacion.tipo}).`);
        console.log(`[INFO] Confirmación de Notificaciones: ${JSON.stringify(confirmacion)}`);
        if (confirmacion.estado === 'error') {
            console.log('[AVISO] El evento se procesó, pero al menos un canal de envío reportó error. Para probar correo real, configura SMTP en el archivo .env.');
        }
        console.log('[OK] Prueba de integración finalizada.');
    } finally {
        if (channel) await channel.close().catch(() => {});
        if (connection) await connection.close().catch(() => {});
    }
}

main().catch(error => {
    console.error('\n[ERROR] Falló la prueba de compra simulada:', error.message);
    process.exitCode = 1;
});
