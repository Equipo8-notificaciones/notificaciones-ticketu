//Cliente RabbitMQ del módulo de Notificaciones.
//Utiliza exchanges tipo topic para los eventos de integración.

const EXCHANGE_GENERAL = 'titec.eventos';
const EXCHANGE_AUTH = 'auth_events';

const TOPICOS_EXCHANGE_AUTH = new Set(['recuperacion_cuenta', 'cuenta_staff']);

function resolverExchange(topic) {
    return TOPICOS_EXCHANGE_AUTH.has(topic) ? EXCHANGE_AUTH : EXCHANGE_GENERAL;
}

let connection;
let channel;

async function conectar() {
    if (channel) return channel;

    // Carga RabbitMQ al usar esta implementación.
    const amqplib = require('amqplib');
    const url = process.env.BROKER_URL || 'amqp://localhost';

    connection = await amqplib.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_GENERAL, 'topic', { durable: true });
    await channel.assertExchange(EXCHANGE_AUTH, 'topic', { durable: true });

    return channel;
}

async function publish(topic, payload) {
    const ch = await conectar();
    const exchange = resolverExchange(topic);
    ch.publish(exchange, topic, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        persistent: true
    });
    return { publicado: true, topic, exchange };
}

async function subscribe(topic, handler) {
    const ch = await conectar();
    const exchange = resolverExchange(topic);
    const { queue } = await ch.assertQueue(`notificaciones.${topic}`, { durable: true });
    await ch.bindQueue(queue, exchange, topic);

    ch.consume(queue, async (msg) => {
        if (!msg) return;
        try {
            const payload = JSON.parse(msg.content.toString());
            await handler(payload);
            ch.ack(msg);
        } catch (error) {
            console.error(`[rabbitmqBroker] error procesando "${topic}":`, error.message);
            ch.nack(msg, false, false);
        }
    });
}

async function cerrar() {
    if (channel) await channel.close();
    if (connection) await connection.close();
    channel = undefined;
    connection = undefined;
}

module.exports = { publish, subscribe, cerrar };
