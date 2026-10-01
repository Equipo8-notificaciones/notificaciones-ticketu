//Cliente RabbitMQ del módulo de Notificaciones
//Utiliza un exchange tipo "topic" para publicar y suscribirse a los eventos definidos en 
//los contratos de integración
const EXCHANGE = 'titec.eventos';

let connection;
let channel;

async function conectar() {
    if (channel) return channel;

    // Carga RabbitMQ solo cuando se utiliza esta implementación.
    const amqplib = require('amqplib');
    const url = process.env.BROKER_URL || 'amqp://localhost';

    connection = await amqplib.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    return channel;
}

async function asegurarExchange(exchange) {
    const ch = await conectar();
    await ch.assertExchange(exchange, 'topic', { durable: true });
    return ch;
}

async function publish(topic, payload) {
    const ch = await conectar();
    ch.publish(EXCHANGE, topic, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        persistent: true
    });
    return { publicado: true, topic };
}

async function publishToExchange(exchange, topic, payload) {
    const ch = await asegurarExchange(exchange);
    ch.publish(exchange, topic, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        persistent: true
    });
    return { publicado: true, exchange, topic };
}

async function subscribe(topic, handler) {
    const ch = await conectar();
    const { queue } = await ch.assertQueue(`notificaciones.${topic}`, { durable: true });
    await ch.bindQueue(queue, EXCHANGE, topic);

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

async function subscribeToExchange(exchange, topic, handler) {
    const ch = await asegurarExchange(exchange);
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

module.exports = { publish, subscribe, publishToExchange, subscribeToExchange, cerrar };