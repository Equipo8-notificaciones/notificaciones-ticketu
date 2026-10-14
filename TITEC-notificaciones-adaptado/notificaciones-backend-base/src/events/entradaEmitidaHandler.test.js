const assert = require('node:assert/strict');
const test = require('node:test');
const { planificarRecordatorio } = require('../jobs/notificacionJobs');

process.env.SMTP_HOST = '';
const { manejarEntradaEmitida } = require('./entradaEmitidaHandler');

function crearEventoEnHoras(horas) {
    const fecha = new Date(Date.now() + horas * 60 * 60 * 1000);
    const pad = (valor) => String(valor).padStart(2, '0');

    return {
        correo_comprador: 'prueba@example.com',
        id_usuario: 'usuario-prueba',
        nombre_comprador: 'Usuario de prueba',
        nombre_evento: 'Evento de prueba',
        id_evento: `evento-${horas}h`,
        fecha_evento: `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`,
        hora_evento: `${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`,
        qr_data: 'QR-PRUEBA'
    };
}

test('compra crea notificaciones APP y EMAIL y programa recordatorio', async () => {
    const resultado = await manejarEntradaEmitida(crearEventoEnHoras(48));
    assert.equal(resultado.estado, 'error');
    assert.equal(resultado.estado_app, 'exitoso');
    assert.equal(resultado.estado_correo, 'error');
    assert.equal(resultado.notificacion_app.canal, 'APP');
    assert.equal(resultado.notificacion_email.canal, 'EMAIL');
});

test('compra con menos de 24 horas crea recordatorio inmediatamente', async () => {
    const resultado = await manejarEntradaEmitida(crearEventoEnHoras(12));
    assert.equal(resultado.estado, 'error');
    assert.equal(resultado.estado_app, 'exitoso');
    assert.equal(resultado.estado_correo, 'error');
    assert.equal(resultado.notificacion_app.titulo, 'COMPRA');
});
