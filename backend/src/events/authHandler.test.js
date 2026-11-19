const assert = require('node:assert/strict');
const test = require('node:test');

// Evita que la prueba intente contactar un servicio SMTP real.
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

const authHandler = require('./authHandler');
const notificacionService = require('../services/notificacionService');

test('recuperacion_cuenta acepta Id_usuario y crea RECUPERACION_PASSWORD', async () => {
    const resultado = await authHandler.manejarRecuperacionCuenta({
        Id_usuario: 'usr-auth-prueba',
        email_destino: 'a@gmail.com',
        url: 'https://ticketu.cl/restablecer?token=token-test'
    });

    assert.equal(resultado.tipo_notificacion, 'RECUPERACION_PASSWORD');
    assert.equal(resultado.estado_envio, 'error'); // SMTP está apagado intencionalmente en la prueba.
    const notificacion = await notificacionService.obtenerPorId(resultado.id_notificacion);
    assert.equal(notificacion.tipo, 'RECUPERACION_PASSWORD');
    assert.equal(notificacion.canal, 'EMAIL');
    const envios = await notificacionService.obtenerEnvios(resultado.id_notificacion);
    assert.equal(envios.length, 3);
    assert.ok(envios.every(envio => envio.estado_envio === 'ERROR'));
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
