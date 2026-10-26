const assert = require('node:assert/strict');
const test = require('node:test');

// Evita que la prueba intente contactar un servicio SMTP real.
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

const authHandler = require('../../src/events/authHandler');
const notificacionService = require('../../src/services/notificacionService');
const broker = require('../../src/broker');

test('recuperacion_cuenta publica email_destino y Error_envio solo ante error', async () => {
    const publicaciones = [];
    const originalPublishToExchange = broker.publishToExchange;
    broker.publishToExchange = async (...args) => publicaciones.push(args);

    try {
        const resultado = await authHandler.manejarRecuperacionCuenta({
            id_usuario: 'usr-auth-prueba',
            email_destino: 'a@gmail.com',
            url: 'https://ticketu.cl/restablecer?token=token-test'
        });

        assert.equal(resultado.tipo_notificacion, 'RECUPERACION_PASSWORD');
        assert.equal(resultado.estado_envio, 'error'); // SMTP está apagado intencionalmente en la prueba.
        assert.equal(resultado.email_destino, 'a@gmail.com');
        assert.ok(resultado.Error_envio);
        assert.equal('gmail_destino' in resultado, false);
        const notificacion = await notificacionService.obtenerPorId(resultado.id_notificacion);
        assert.equal(notificacion.tipo, 'RECUPERACION_PASSWORD');
        assert.equal(notificacion.canal, 'EMAIL');
        const envios = await notificacionService.obtenerEnvios(resultado.id_notificacion);
        assert.equal(envios.length, 3);
        assert.ok(envios.every(envio => envio.estado_envio === 'ERROR'));
        assert.equal(publicaciones.length, 1);
        assert.deepEqual(publicaciones[0].slice(0, 2), ['notificaciones.events', 'correo_auth']);
        assert.equal(publicaciones[0][2].email_destino, 'a@gmail.com');
        assert.equal(publicaciones[0][2].estado_envio, 'error');
        assert.match(publicaciones[0][2].Error_envio, /Falló el envío después de 3 intentos/);
    } finally {
        broker.publishToExchange = originalPublishToExchange;
    }
});

test('un envío Auth exitoso publica email_destino sin Error_envio', async () => {
    const publicaciones = [];
    const originalPublishToExchange = broker.publishToExchange;
    const originalEnviarCorreo = require('../../src/services/emailService').enviarCorreo;
    broker.publishToExchange = async (...args) => publicaciones.push(args);
    require('../../src/services/emailService').enviarCorreo = async () => ({ enviado: true });

    try {
        const resultado = await authHandler.manejarCrearCuenta({
            email_destino: 'staff@gmail.com',
            url: 'https://ticketu.cl/restablecer?token=token-staff-success'
        });

        assert.deepEqual(resultado, {
            email_destino: 'staff@gmail.com',
            estado_envio: 'exitoso',
            id_notificacion: resultado.id_notificacion,
            tipo_notificacion: 'CREACION_STAFF'
        });
        assert.equal('Error_envio' in resultado, false);
        assert.equal(publicaciones[0][2].email_destino, 'staff@gmail.com');
        assert.equal(publicaciones[0][2].estado_envio, 'exitoso');
        assert.equal('Error_envio' in publicaciones[0][2], false);
    } finally {
        broker.publishToExchange = originalPublishToExchange;
        require('../../src/services/emailService').enviarCorreo = originalEnviarCorreo;
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

test('cuenta_staff crea CREACION_STAFF aunque el contrato no tenga Id_usuario', async () => {
    const resultado = await authHandler.manejarCrearCuenta({
        email_destino: 'staff@gmail.com',
        url: 'https://ticketu.cl/restablecer?token=token-staff-test'
    });

    assert.equal(resultado.tipo_notificacion, 'CREACION_STAFF');
    const notificacion = await notificacionService.obtenerPorId(resultado.id_notificacion);
    assert.equal(notificacion.tipo, 'CREACION_STAFF');
    assert.equal(notificacion.id_usuario, 'staff@gmail.com');
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
