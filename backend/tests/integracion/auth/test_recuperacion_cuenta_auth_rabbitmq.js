const assert = require('node:assert/strict');
const amqp = require('amqplib');
const net = require('node:net');

const AUTH_SERVICE_URL = (process.env.AUTH_SERVICE_URL || 'http://auth-service:10000').replace(/\/+$/, '');
const BROKER_URL = process.env.BROKER_URL || 'amqp://ticketu:ticketu_dev@ticketu-rabbitmq:5672/ticketu';
const EMAIL = process.env.TEST_EMAIL_DESTINO;
const TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS || 45000);

function isPortClosed(host, port) {
    return new Promise(resolve => {
        const socket = net.createConnection({ host, port });
        socket.setTimeout(1000);
        socket.once('connect', () => {
            socket.destroy();
            resolve(false);
        });
        socket.once('error', () => resolve(true));
        socket.once('timeout', () => {
            socket.destroy();
            resolve(true);
        });
    });
}

async function observe(channel, exchange, routingKey, matches) {
    await channel.assertExchange(exchange, 'topic', { durable: true });
    const { queue } = await channel.assertQueue('', {
        durable: false,
        exclusive: true,
        autoDelete: true
    });
    await channel.bindQueue(queue, exchange, routingKey);

    let resolveMessage;
    let rejectMessage;
    const message = new Promise((resolve, reject) => {
        resolveMessage = resolve;
        rejectMessage = reject;
    });
    const timer = setTimeout(() => rejectMessage(new Error(`timeout_${routingKey}`)), TIMEOUT_MS);
    let consumerTag;

    try {
        const consumer = await channel.consume(queue, incoming => {
            if (!incoming) return;
            let payload;
            try {
                payload = JSON.parse(incoming.content.toString('utf8'));
            } catch {
                channel.ack(incoming);
                return;
            }
            channel.ack(incoming);
            if (matches(payload)) {
                clearTimeout(timer);
                resolveMessage(payload);
            }
        }, { noAck: false });
        consumerTag = consumer.consumerTag;
    } catch (error) {
        clearTimeout(timer);
        throw error;
    }

    return {
        message,
        async close() {
            clearTimeout(timer);
            if (consumerTag) await channel.cancel(consumerTag).catch(() => {});
        }
    };
}

async function main() {
    assert.ok(EMAIL && EMAIL.includes('@'), 'Define TEST_EMAIL_DESTINO con una cuenta COMPRADOR existente.');
    assert.equal(process.env.SMTP_HOST, '127.0.0.1', 'SMTP debe quedar aislado en loopback.');
    assert.equal(process.env.SMTP_PORT, '1', 'SMTP debe apuntar al puerto cerrado 1.');
    assert.ok(await isPortClosed('127.0.0.1', 1), 'El puerto SMTP de prueba debe estar cerrado.');

    const connection = await amqp.connect(BROKER_URL);
    const channel = await connection.createChannel();
    let requestObserver;
    let responseObserver;

    try {
        requestObserver = await observe(
            channel,
            'auth.events',
            'recuperacion_cuenta',
            payload => String(payload.email_destino || '').toLowerCase() === EMAIL.toLowerCase()
        );
        responseObserver = await observe(
            channel,
            'notificaciones.events',
            'correo_auth',
            payload => String(payload.email_destino || '').toLowerCase() === EMAIL.toLowerCase()
        );

        const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL })
        });
        assert.equal(response.status, 200, 'Auth debe aceptar la solicitud de recuperación.');

        const [eventoAuth, respuestaNotificaciones] = await Promise.all([
            requestObserver.message,
            responseObserver.message
        ]);

        const idUsuario = eventoAuth.Id_usuario ?? eventoAuth.id_usuario;
        assert.ok(typeof idUsuario === 'string' && idUsuario.trim(), 'El evento debe incluir el identificador de usuario.');
        assert.equal(String(eventoAuth.email_destino || '').toLowerCase(), EMAIL.toLowerCase());

        const urlRecuperacion = new URL(eventoAuth.url);
        assert.equal(urlRecuperacion.pathname, '/restablecer');
        assert.ok(urlRecuperacion.searchParams.get('token'), 'El evento debe incluir un token de recuperación.');

        assert.equal(String(respuestaNotificaciones.email_destino || '').toLowerCase(), EMAIL.toLowerCase());
        assert.equal(respuestaNotificaciones.estado_envio, 'error',
            'El envío debe fallar porque SMTP está aislado intencionalmente.');

        console.log('OK: Auth /api/auth/recover respondió 200.');
        console.log('OK: Auth publicó recuperacion_cuenta en RabbitMQ; el token no se mostró.');
        console.log('OK: Notificaciones respondió por correo_auth.');
        console.log('OK: SMTP aislado; el estado error es esperado y no se envió correo externo.');
    } finally {
        if (requestObserver) await requestObserver.close();
        if (responseObserver) await responseObserver.close();
        await channel.close().catch(() => {});
        await connection.close().catch(() => {});
    }
}

main().catch(error => {
    console.error(`FALLO en recuperación Auth → Notificaciones: ${error.code || error.message}`);
    process.exitCode = 1;
});
