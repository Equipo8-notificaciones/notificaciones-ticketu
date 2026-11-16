const assert = require('node:assert/strict');
const test = require('node:test');

// Evita que la prueba intente contactar un servicio SMTP real.
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

const authHandler = require('../../src/events/authHandler');
const broker = require('../../src/broker');

test('recuperacion_cuenta publica email_destino y error_envio solo ante error', async () => {
    const publicaciones = [];
    const originalPublishToExchange = broker.publishToExchange;
    const emailService = require('../../src/services/emailService');
    const originalEnviarCorreoConReintentos = emailService.enviarCorreoConReintentos;
    let correoEnviado;
    broker.publishToExchange = async (...args) => publicaciones.push(args);
    emailService.enviarCorreoConReintentos = async (destino, asunto, cuerpo) => {
        correoEnviado = { destino, asunto, cuerpo };
        throw new Error('Falló el envío después de 3 intentos: Error SMTP de prueba');
    };

    try {
        const url = 'https://ticketu.cl/restablecer?token=token-test';
        const resultado = await authHandler.manejarRecuperacionCuenta({
            id_usuario: 'usr-auth-prueba',
            email_destino: 'a@gmail.com',
            url
        });

        assert.equal(resultado.estado_envio, 'error');
        assert.equal(resultado.email_destino, 'a@gmail.com');
        assert.ok(resultado.error_envio);
        assert.equal(correoEnviado.destino, 'a@gmail.com');
        assert.match(correoEnviado.cuerpo, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.equal(publicaciones.length, 1);
        assert.deepEqual(publicaciones[0].slice(0, 2), ['notificaciones.events', 'correo_auth']);
        assert.equal(publicaciones[0][2].email_destino, 'a@gmail.com');
        assert.equal(publicaciones[0][2].estado_envio, 'error');
        assert.match(publicaciones[0][2].error_envio, /Falló el envío después de 3 intentos/);
        assert.deepEqual(Object.keys(publicaciones[0][2]).sort(), [
            'email_destino', 'error_envio', 'estado_envio'
        ]);
    } finally {
        broker.publishToExchange = originalPublishToExchange;
        emailService.enviarCorreoConReintentos = originalEnviarCorreoConReintentos;
    }
});

test('cuenta_staff envía el url y publica email_destino sin error_envio', async () => {
    const publicaciones = [];
    const originalPublishToExchange = broker.publishToExchange;
    const emailService = require('../../src/services/emailService');
    const originalEnviarCorreoConReintentos = emailService.enviarCorreoConReintentos;
    let correoEnviado;
    broker.publishToExchange = async (...args) => publicaciones.push(args);
    emailService.enviarCorreoConReintentos = async (destino, asunto, cuerpo) => {
        correoEnviado = { destino, asunto, cuerpo };
        return { enviado: true };
    };

    try {
        const url = 'https://ticketu.cl/restablecer?token=token-staff-success';
        const resultado = await authHandler.manejarCrearCuenta({
            email_destino: 'staff@gmail.com',
            url
        });

        assert.deepEqual(resultado, {
            email_destino: 'staff@gmail.com',
            estado_envio: 'exitoso'
        });
        assert.equal(correoEnviado.destino, 'staff@gmail.com');
        assert.match(correoEnviado.cuerpo, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.equal('error_envio' in resultado, false);
        assert.equal(publicaciones[0][2].email_destino, 'staff@gmail.com');
        assert.equal(publicaciones[0][2].estado_envio, 'exitoso');
        assert.equal('error_envio' in publicaciones[0][2], false);
        assert.deepEqual(Object.keys(publicaciones[0][2]).sort(), [
            'email_destino', 'estado_envio'
        ]);
    } finally {
        broker.publishToExchange = originalPublishToExchange;
        emailService.enviarCorreoConReintentos = originalEnviarCorreoConReintentos;
    }
});

test('rechaza evento Auth sin email_destino sin enviar ni publicar confirmación', async () => {
    const publicaciones = [];
    const originalPublishToExchange = broker.publishToExchange;
    broker.publishToExchange = async (...args) => publicaciones.push(args);

    try {
        await assert.rejects(
            authHandler.manejarRecuperacionCuenta({
                id_usuario: 'usr-sin-gmail',
                url: 'https://ticketu.cl/restablecer?token=sin-gmail'
            }),
            /falta el campo "email_destino"/
        );
        assert.equal(publicaciones.length, 0);
    } finally {
        broker.publishToExchange = originalPublishToExchange;
    }
});

test('rechaza recuperacion_cuenta sin id_usuario sin publicar confirmación', async () => {
    const publicaciones = [];
    const originalPublishToExchange = broker.publishToExchange;
    broker.publishToExchange = async (...args) => publicaciones.push(args);

    try {
        await assert.rejects(
            authHandler.manejarRecuperacionCuenta({
                email_destino: 'usuario@ejemplo.com',
                url: 'https://ticketu.cl/restablecer?token=sin-id'
            }),
            /falta el campo "id_usuario"/
        );
        assert.equal(publicaciones.length, 0);
    } finally {
        broker.publishToExchange = originalPublishToExchange;
    }
});
