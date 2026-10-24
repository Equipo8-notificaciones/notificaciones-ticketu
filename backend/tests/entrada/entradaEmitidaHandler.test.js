const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const test = require('node:test');
const { planificarRecordatorio } = require('../../src/jobs/notificacionJobs');
const broker = require('../../src/broker');

process.env.SMTP_HOST = '';
const { manejarEntradaEmitida } = require('../../src/events/entradaEmitidaHandler');
const publicarOriginal = broker.publishToExchange;
let confirmaciones;

test.beforeEach(() => {
    confirmaciones = [];
    broker.publishToExchange = async (exchange, topic, payload) => {
        confirmaciones.push({ exchange, topic, payload });
    };
});

test.afterEach(() => {
    broker.publishToExchange = publicarOriginal;
});

function crearEventoEnHoras(horas) {
    const fecha = new Date(Date.now() + horas * 60 * 60 * 1000);
    const pad = (valor) => String(valor).padStart(2, '0');

    return {
        event_id: randomUUID(),
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
    const evento = crearEventoEnHoras(48);
    const resultado = await manejarEntradaEmitida(evento);
    assert.equal(resultado.estado, 'error');
    assert.equal(resultado.estado_app, 'exitoso');
    assert.equal(resultado.estado_correo, 'error');
    assert.equal(resultado.notificacion_app.canal, 'APP');
    assert.equal(resultado.notificacion_email.canal, 'EMAIL');
    assert.deepEqual(confirmaciones.map(confirmacion => confirmacion.payload.estado), ['en_cola', 'programado']);
    assert.ok(confirmaciones.every(confirmacion =>
        confirmacion.exchange === 'notificaciones.event' &&
        confirmacion.topic === 'notificaciones.confirmacion_envio' &&
        confirmacion.payload.id_usuario === evento.id_usuario &&
        confirmacion.payload.id_evento === evento.id_evento
    ));
});

test('compra con menos de 24 horas crea recordatorio inmediatamente', async () => {
    const evento = crearEventoEnHoras(12);
    const resultado = await manejarEntradaEmitida(evento);
    assert.equal(resultado.estado, 'error');
    assert.equal(resultado.estado_app, 'exitoso');
    assert.equal(resultado.estado_correo, 'error');
    assert.equal(resultado.notificacion_app.titulo, 'COMPRA');
    assert.deepEqual(confirmaciones.map(confirmacion => confirmacion.payload.estado), ['en_cola']);
    assert.equal(confirmaciones[0].payload.id_usuario, evento.id_usuario);
    assert.equal(confirmaciones[0].payload.id_evento, evento.id_evento);
});
