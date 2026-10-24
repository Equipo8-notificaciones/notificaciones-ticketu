const test = require('node:test');
const assert = require('node:assert/strict');
const entradasService = require('../../src/services/entradasService');
const notificacionService = require('../../src/services/notificacionService');
const handler = require('../../src/events/panelEventoHandler');

const originales = {
    obtenerUsuariosConEntradasActivas: entradasService.obtenerUsuariosConEntradasActivas,
    crearNotificacion: notificacionService.crearNotificacion,
    enviarConReintentos: notificacionService.enviarConReintentos
};

test.afterEach(() => {
    Object.assign(entradasService, {
        obtenerUsuariosConEntradasActivas: originales.obtenerUsuariosConEntradasActivas
    });
    Object.assign(notificacionService, {
        crearNotificacion: originales.crearNotificacion,
        enviarConReintentos: originales.enviarConReintentos
    });
});

function prepararNotificaciones({ usuarios, fallarIds = [] }) {
    const creadas = [];
    entradasService.obtenerUsuariosConEntradasActivas = async idEvento => {
        assert.equal(idEvento, 'evt-001');
        return usuarios;
    };
    notificacionService.crearNotificacion = async datos => {
        const notificacion = { id_notificacion: creadas.length + 1, ...datos };
        creadas.push(notificacion);
        return notificacion;
    };
    notificacionService.enviarConReintentos = async idNotificacion => {
        if (fallarIds.includes(idNotificacion)) throw new Error('falló el canal');
    };
    return creadas;
}

test('evento_actualizado consulta entradas activas y confirma al id_usuario enviado por Panel', async () => {
    const creadas = prepararNotificaciones({
        usuarios: [
            { id_usuario: 'user-1' },
            { id_usuario: 'user-1' },
            { id_usuario: 'user-2' },
            { id_usuario: 'user-3' },
            { id_usuario: 'user-4' },
            { id_usuario: 'user-5' }
        ]
    });

    const resultado = await handler.manejarEventoActualizado({
        id_evento: 'evt-001',
        id_usuario: 'staff-001',
        nuevo_estado: 'cancelado'
    });

    assert.deepEqual(resultado, {
        id_evento: 'evt-001',
        nuevo_estado: 'exito',
        usuarios_notificados: 5,
        usuarios_faltantes: 0,
        fecha_envio: resultado.fecha_envio
    });
    assert.equal(Number.isNaN(Date.parse(resultado.fecha_envio)), false);
    assert.deepEqual(creadas.slice(0, 5).map(n => n.id_usuario), [
        'user-1', 'user-2', 'user-3', 'user-4', 'user-5'
    ]);
    assert.equal(creadas[0].datos.nuevo_estado, 'cancelado');
    assert.equal(creadas.at(-1).id_usuario, 'staff-001');
    assert.deepEqual(creadas.at(-1).datos, resultado);
});

test('evento_actualizado considera error cuando solo se notifica al 60% de los usuarios', async () => {
    const creadas = prepararNotificaciones({
        usuarios: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']
            .map(id_usuario => ({ id_usuario })),
        fallarIds: [2, 4]
    });

    const resultado = await handler.manejarEventoActualizado({
        id_evento: 'evt-001',
        id_usuario: 'staff-001',
        nuevo_estado: 'finalizado'
    });

    assert.equal(resultado.nuevo_estado, 'error');
    assert.equal(resultado.usuarios_notificados, 3);
    assert.equal(resultado.usuarios_faltantes, 2);
    assert.equal(creadas.at(-1).id_usuario, 'staff-001');
    assert.equal(creadas.at(-1).datos.nuevo_estado, 'error');
});

test('evento_reprogramdo notifica con la nueva fecha y hora y aplica el umbral mayor al 60%', async () => {
    const creadas = prepararNotificaciones({
        usuarios: ['user-1', 'user-2', 'user-3']
            .map(id_usuario => ({ id_usuario }))
    });

    const resultado = await handler.manejarEventoReprogramado({
        id_evento: 'evt-001',
        id_usuario: 'staff-001',
        nuevo_estado: 'publicado',
        fecha_cambio: '2026-09-13',
        hora_cambio: '00:00:00'
    });

    assert.equal(resultado.nuevo_estado, 'exito');
    assert.equal(creadas[0].datos.fecha_cambio, '2026-09-13');
    assert.equal(creadas[0].datos.hora_cambio, '00:00:00');
    assert.match(creadas[0].mensaje, /2026-09-13 a las 00:00:00/);
    assert.equal(creadas.at(-1).id_usuario, 'staff-001');
});

test('rechaza eventos incompletos, estados inválidos y fechas de reprogramación inválidas', async () => {
    await assert.rejects(
        handler.manejarEventoActualizado({ id_evento: 'evt-001', nuevo_estado: 'cancelado' }),
        /Debe indicar id_usuario/
    );
    await assert.rejects(
        handler.manejarEventoActualizado({
            id_evento: 'evt-001',
            id_usuario: 'staff-001',
            nuevo_estado: 'reprogramado'
        }),
        /nuevo_estado/
    );
    await assert.rejects(
        handler.manejarEventoReprogramado({
            id_evento: 'evt-001',
            id_usuario: 'staff-001',
            nuevo_estado: 'publicado',
            fecha_cambio: '2026-02-30',
            hora_cambio: '25:00:00'
        }),
        /fecha_cambio/
    );
});
