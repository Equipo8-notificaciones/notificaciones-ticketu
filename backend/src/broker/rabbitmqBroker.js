// Cliente RabbitMQ del módulo de Notificaciones.
// Mantiene una conexión compartida, confirma publicaciones y permite re-suscribirse
// cuando RabbitMQ o la conexión se reinician.

let connection;
let channel;
let connectingPromise;
let disconnectPromise;
let resolveDisconnect;

function invalidarConexion(conn) {
    if (conn && connection && conn !== connection) return;
    channel = undefined;
    connection = undefined;
    const resolver = resolveDisconnect;
    resolveDisconnect = undefined;
    disconnectPromise = undefined;
    if (resolver) resolver();
}

async function conectar() {
    if (connection && channel) return channel;
    if (connectingPromise) return connectingPromise;

    connectingPromise = (async () => {
        const amqplib = require('amqplib');
        const url = process.env.BROKER_URL;
        if (!url) throw new Error('Falta configurar BROKER_URL para RabbitMQ.');

        const nuevaConexion = await amqplib.connect(url, {
            heartbeat: Number(process.env.BROKER_HEARTBEAT_SECONDS || 30)
        });
        nuevaConexion.on('error', error => {
            console.error('[rabbitmqBroker] Error de conexión:', error.message);
        });
        nuevaConexion.once('close', () => invalidarConexion(nuevaConexion));

        try {
            const nuevoCanal = await nuevaConexion.createConfirmChannel();
            nuevoCanal.on('error', error => {
                console.error('[rabbitmqBroker] Error de canal:', error.message);
            });
            nuevoCanal.once('close', () => invalidarConexion(nuevaConexion));
            connection = nuevaConexion;
            channel = nuevoCanal;
            disconnectPromise = new Promise(resolve => { resolveDisconnect = resolve; });
            console.log('[rabbitmqBroker] Conectado a RabbitMQ.');
            return channel;
        } catch (error) {
            await nuevaConexion.close().catch(() => {});
            throw error;
        }
    })();

    try {
        return await connectingPromise;
    } finally {
        connectingPromise = undefined;
    }
}

async function esperarDesconexion() {
    if (!connection || !disconnectPromise) return;
    await disconnectPromise;
}

async function asegurarExchange(exchange) {
    const ch = await conectar();
    await ch.assertExchange(exchange, 'topic', { durable: true });
    return ch;
}

async function publish(exchange, topic, payload) {
    return publishToExchange(exchange, topic, payload);
}

async function publishToExchange(exchange, topic, payload, properties = {}) {
    const ch = await asegurarExchange(exchange);
    ch.publish(exchange, topic, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        persistent: true,
        ...properties
    });
    await ch.waitForConfirms();
    return { publicado: true, exchange, topic };
}

async function subscribe(exchange, topic, handler) {
    return subscribeToExchange(exchange, topic, handler);
}

async function subscribeToExchange(exchange, topic, handler) {
    const ch = await asegurarExchange(exchange);
    const queue = `notificaciones.${topic}`;
    await ch.assertQueue(queue, { durable: true });
    await ch.bindQueue(queue, exchange, topic);
    await ch.consume(queue, async msg => {
        if (!msg) return;
        try {
            const payload = JSON.parse(msg.content.toString('utf8'));
            await handler(payload, {
                type: msg.properties.type,
                messageId: msg.properties.messageId,
                exchange: msg.fields.exchange,
                routingKey: msg.fields.routingKey
            });
            ch.ack(msg);
        } catch (error) {
            console.error(`[rabbitmqBroker] Error procesando "${exchange}/${topic}":`, error.message);
            try { ch.nack(msg, false, false); } catch { /* El canal pudo cerrarse. */ }
        }
    }, { noAck: false });
    console.log(`[rabbitmqBroker] Suscrito a ${exchange} / ${topic} (${queue}).`);
}

/**
 * Suscripción a Panel: el proveedor publica el mismo evento en ticketu.events y,
 * según el entorno, en un exchange dedicado. La routing key es fija; el tipo real
 * del evento llega en la propiedad AMQP `type`, no en la routing key.
 */
async function subscribePanelEvents({ exchanges, routingKey, queueName, handler }) {
    if (!Array.isArray(exchanges) || exchanges.length === 0) {
        throw new Error('PANEL_EVENT_EXCHANGES debe contener al menos un exchange.');
    }
    const ch = await conectar();
    await ch.assertQueue(queueName, { durable: true });
    for (const exchange of [...new Set(exchanges)]) {
        await ch.assertExchange(exchange, 'topic', { durable: true });
        await ch.bindQueue(queueName, exchange, routingKey);
    }

    await ch.consume(queueName, async msg => {
        if (!msg) return;
        try {
            const body = JSON.parse(msg.content.toString('utf8'));
            await handler(body, {
                type: msg.properties.type,
                messageId: msg.properties.messageId,
                exchange: msg.fields.exchange,
                routingKey: msg.fields.routingKey
            });
            ch.ack(msg);
        } catch (error) {
            console.error('[rabbitmqBroker] Error procesando mensaje de Panel:', error.message);
            try { ch.nack(msg, false, false); } catch { /* El canal pudo cerrarse. */ }
        }
    }, { noAck: false });

    console.log(`[rabbitmqBroker] Panel suscrito a ${exchanges.join(', ')} / ${routingKey} (${queueName}).`);
}

async function cerrar() {
    const conn = connection;
    const ch = channel;
    channel = undefined;
    connection = undefined;
    if (resolveDisconnect) {
        const resolver = resolveDisconnect;
        resolveDisconnect = undefined;
        disconnectPromise = undefined;
        resolver();
    }
    if (ch) await ch.close().catch(() => {});
    if (conn) await conn.close().catch(() => {});
}

module.exports = {
    publish,
    subscribe,
    publishToExchange,
    subscribeToExchange,
    subscribePanelEvents,
    esperarDesconexion,
    cerrar
};
