const assert = require('node:assert/strict');
const test = require('node:test');
const entradasService = require('../../src/services/entradasService');
const notificacionService = require('../../src/services/notificacionService');
const servicio = require('../../src/services/recordatorioEventoService');

const originales = {
    obtenerEstadoRecordatorio: entradasService.obtenerEstadoRecordatorio,
    crearNotificacion: notificacionService.crearNotificacion,
    enviarConReintentos: notificacionService.enviarConReintentos
};

test.afterEach(() => {
    entradasService.obtenerEstadoRecordatorio = originales.obtenerEstadoRecordatorio;
    notificacionService.crearNotificacion = originales.crearNotificacion;
    notificacionService.enviarConReintentos = originales.enviarConReintentos;
});

function datosRecordatorio() {
    return {
        id_usuario: 'user-1',
        id_evento: 'event-1',
        nombre_evento: 'Evento de prueba',
        fecha_evento: '2026-12-13',
        hora_evento: '18:00'
    };
}

test('no envía recordatorio si la base de datos marca el evento como cancelado', async () => {
    let notificacionesCreadas = 0;
    entradasService.obtenerEstadoRecordatorio = async (idUsuario, idEvento) => {
        assert.equal(idUsuario, 'user-1');
        assert.equal(idEvento, 'event-1');
        return { estado_evento: 'CANCELADO', evento_futuro: true };
    };
    notificacionService.crearNotificacion = async () => {
        notificacionesCreadas++;
        return { id_notificacion: 1 };
    };

    const resultado = await servicio.enviarRecordatorioEvento(datosRecordatorio());

    assert.deepEqual(resultado, { enviado: false, motivo: 'evento_cancelado' });
    assert.equal(notificacionesCreadas, 0);
});

test('no envía recordatorio si el evento ya no es futuro', async () => {
    let notificacionesCreadas = 0;
    entradasService.obtenerEstadoRecordatorio = async () => ({
        estado_evento: 'PROGRAMADO',
        evento_futuro: false
    });
    notificacionService.crearNotificacion = async () => {
        notificacionesCreadas++;
        return { id_notificacion: 1 };
    };

    const resultado = await servicio.enviarRecordatorioEvento(datosRecordatorio());

    assert.deepEqual(resultado, { enviado: false, motivo: 'evento_no_futuro' });
    assert.equal(notificacionesCreadas, 0);
});

test('envía recordatorio solo tras verificar estado y fecha futura en la base', async () => {
    const orden = [];
    entradasService.obtenerEstadoRecordatorio = async () => {
        orden.push('verificacion');
        return { estado_evento: 'PROGRAMADO', evento_futuro: true };
    };
    notificacionService.crearNotificacion = async () => {
        orden.push('creacion');
        return { id_notificacion: 1 };
    };
    notificacionService.enviarConReintentos = async () => {
        orden.push('envio');
    };

    const resultado = await servicio.enviarRecordatorioEvento(datosRecordatorio());

    assert.deepEqual(resultado, { enviado: true });
    assert.deepEqual(orden, ['verificacion', 'creacion', 'envio']);
});
