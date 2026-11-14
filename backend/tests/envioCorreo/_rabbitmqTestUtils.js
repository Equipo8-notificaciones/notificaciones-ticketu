require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../../.env') });

const amqp = require('amqplib');

const BROKER_URL = process.env.BROKER_URL || 'amqp://localhost:5672/ticketu';
const TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS || 30000);

async function abrirCanal() {
    const connection = await amqp.connect(BROKER_URL);
    const channel = await connection.createConfirmChannel();
    return { connection, channel };
}

async function esperarMensaje(channel, exchange, routingKey) {
    await channel.assertExchange(exchange, 'topic', { durable: true });
    const { queue } = await channel.assertQueue('', {
        durable: false,
        exclusive: true,
        autoDelete: true
    });
    await channel.bindQueue(queue, exchange, routingKey);

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`No llegó ${exchange}/${routingKey} en ${TIMEOUT_MS} ms.`));
        }, TIMEOUT_MS);
        channel.consume(queue, message => {
            if (!message) return;
            clearTimeout(timer);
            try {
                resolve(JSON.parse(message.content.toString('utf8')));
            } catch (error) {
                reject(new Error(`El mensaje ${exchange}/${routingKey} no contiene JSON válido: ${error.message}`));
            } finally {
                channel.ack(message);
            }
        }, { noAck: false }).catch(error => {
            clearTimeout(timer);
            reject(error);
        });
    });
}

async function publicar(channel, exchange, routingKey, payload) {
    await channel.assertExchange(exchange, 'topic', { durable: true });
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        persistent: true,
        messageId: `test-${routingKey}-${Date.now()}`
    });
    await channel.waitForConfirms();
}

module.exports = {
    BROKER_URL,
    TIMEOUT_MS,
    abrirCanal,
    esperarMensaje,
    publicar
};
