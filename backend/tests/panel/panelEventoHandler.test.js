const test = require('node:test');
const assert = require('node:assert/strict');
const entradasService = require('../../src/services/entradasService');
const notificacionService = require('../../src/services/notificacionService');
const recordatorioEventoService = require('../../src/services/recordatorioEventoService');
const handler = require('../../src/events/panelEventoHandler');

const originales = {
    obtenerUsuariosConEntradasActivas: entradasService.obtenerUsuariosConEntradasActivas,
    obtenerFechaEvento: entradasService.obtenerFechaEvento,
    actualizarFechaEvento: entradasService.actualizarFechaEvento,
    marcarEventoCancelado: entradasService.marcarEventoCancelado,
    crearNotificacion: notificacionService.crearNotificacion,
    enviarConReintentos: notificacionService.enviarConReintentos,
    programarRecordatorioEvento: recordatorioEventoService.programarRecordatorioEvento
};

test.afterEach(() => {
    Object.assign(entradasService, {
        obtenerUsuariosConEntradasActivas: originales.obtenerUsuariosConEntradasActivas,
        obtenerFechaEvento: originales.obtenerFechaEvento,
        actualizarFechaEvento: originales.actualizarFechaEvento,
        marcarEventoCancelado: originales.marcarEventoCancelado
    });
    Object.assign(notificacionService, {
        crearNotificacion: originales.crearNotificacion,
        enviarConReintentos: originales.enviarConReintentos
    });
    recordatorioEventoService.programarRecordatorioEvento =
        originales.programarRecordatorioEvento;
});

function prepararNotificaciones({ usuarios, fallarIds = [] }) {
    const creadas = [];
    entradasService.obtenerFechaEvento = async idEvento => {
        assert.equal(idEvento, 'evt-001');
        return { fecha_evento: new Date(Date.now() + 60 * 60 * 1000), es_futuro: true };
    };
    entradasService.actualizarFechaEvento = async (idEvento, fecha, hora) => {
        assert.equal(idEvento, 'evt-001');
        assert.equal(fecha, '2026-12-13');
        assert.equal(hora, '00:00:00');
        return usuarios.map(usuario => ({
            ...usuario,
            entrada_activa: true,
            nombre_evento: 'Concierto',
            fecha_actualizada: true
        }));
    };
    entradasService.marcarEventoCancelado = async idEvento => {
        assert.equal(idEvento, 'evt-001');
        return usuarios.map(usuario => ({ ...usuario, estado_evento: 'CANCELADO' }));
    };
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
        nuevo_estado: 'cancelado'
    });

    assert.equal(resultado.nuevo_estado, 'error');
    assert.equal(resultado.usuarios_notificados, 3);
    assert.equal(resultado.usuarios_faltantes, 2);
    assert.equal(creadas.at(-1).id_usuario, 'staff-001');
    assert.equal(creadas.at(-1).datos.nuevo_estado, 'error');
});

test('evento_reprogramado solo acepta publicado y notifica con la nueva fecha y hora', async () => {
    const creadas = prepararNotificaciones({
        usuarios: ['user-1', 'user-2', 'user-3']
            .map(id_usuario => ({ id_usuario }))
    });

    const resultado = await handler.manejarEventoReprogramado({
        id_evento: 'evt-001',
        id_usuario: 'staff-001',
        nuevo_estado: 'publicado',
        fecha_cambio: '2026-12-13',
        hora_cambio: '00:00:00'
    });

    assert.equal(resultado.nuevo_estado, 'exito');
    assert.equal(creadas[0].datos.fecha_evento, '2026-12-13');
    assert.equal(creadas[0].datos.hora_evento, '00:00:00');
    assert.match(creadas[0].mensaje, /2026-12-13 a las 00:00:00/);
    assert.equal(creadas.at(-1).id_usuario, 'staff-001');
});

test('evento_reprogramado verifica la actualización y reemplaza recordatorios activos', async () => {
    const creadas = prepararNotificaciones({
        usuarios: [
            { id_usuario: 'user-1' },
            { id_usuario: 'user-2' }
        ]
    });
    const actualizados = [];
    const recordatorios = [];
    entradasService.actualizarFechaEvento = async (...argumentos) => {
        actualizados.push(argumentos);
        return [
            { id_usuario: 'user-1', nombre_evento: 'Concierto', entrada_activa: true, fecha_actualizada: true },
            { id_usuario: 'user-2', nombre_evento: 'Concierto', entrada_activa: true, fecha_actualizada: true },
            { id_usuario: 'user-3', nombre_evento: 'Concierto', entrada_activa: false, fecha_actualizada: true }
        ];
    };
    recordatorioEventoService.programarRecordatorioEvento = async datos => {
        recordatorios.push(datos);
    };

    await handler.manejarEventoReprogramado({
        id_evento: 'evt-001',
        id_usuario: 'staff-001',
        nuevo_estado: 'publicado',
        fecha_cambio: '2026-12-13',
        hora_cambio: '00:00:00'
    });

    assert.deepEqual(actualizados, [['evt-001', '2026-12-13', '00:00:00']]);
    assert.deepEqual(recordatorios.map(({ id_usuario, fecha_evento, hora_evento }) => ({
        id_usuario,
        fecha_evento,
        hora_evento
    })), [
        { id_usuario: 'user-1', fecha_evento: '2026-12-13', hora_evento: '00:00:00' },
        { id_usuario: 'user-2', fecha_evento: '2026-12-13', hora_evento: '00:00:00' }
    ]);
    assert.equal(creadas.filter(n => n.tipo === 'EVENTO_CAMBIO').length, 3);
});

test('no envía notificaciones si falla la actualización de fecha en la base de datos', async () => {
    let notificacionesCreadas = 0;
    entradasService.obtenerFechaEvento = async () => ({
        fecha_evento: new Date(Date.now() + 60 * 60 * 1000),
        es_futuro: true
    });
    entradasService.actualizarFechaEvento = async () => {
        throw new Error('No se pudo verificar actualización');
    };
    notificacionService.crearNotificacion = async () => {
        notificacionesCreadas++;
        return { id_notificacion: 1 };
    };

    await assert.rejects(
        handler.manejarEventoReprogramado({
            id_evento: 'evt-001',
            id_usuario: 'staff-001',
            nuevo_estado: 'publicado',
            fecha_cambio: '2026-12-13',
            hora_cambio: '00:00:00'
        }),
        /No se pudo verificar actualización/
    );
    assert.equal(notificacionesCreadas, 0);
});

test('evento_actualizado cancela el estado en la base antes de notificar', async () => {
    const creadas = prepararNotificaciones({ usuarios: [{ id_usuario: 'user-1' }] });
    let cancelado = false;
    entradasService.marcarEventoCancelado = async idEvento => {
        assert.equal(idEvento, 'evt-001');
        cancelado = true;
        return [{ id_usuario: 'user-1', estado_evento: 'CANCELADO' }];
    };
    notificacionService.crearNotificacion = async datos => {
        assert.equal(cancelado, true);
        const notificacion = { id_notificacion: creadas.length + 1, ...datos };
        creadas.push(notificacion);
        return notificacion;
    };

    await handler.manejarEventoActualizado({
        id_evento: 'evt-001',
        id_usuario: 'staff-001',
        nuevo_estado: 'cancelado'
    });

    assert.equal(cancelado, true);
    assert.equal(creadas[0].id_usuario, 'user-1');
});

test('no notifica la cancelación si no se pudo actualizar estado_evento en la base', async () => {
    let notificacionesCreadas = 0;
    entradasService.obtenerFechaEvento = async () => ({
        fecha_evento: new Date(Date.now() + 60 * 60 * 1000),
        es_futuro: true
    });
    entradasService.marcarEventoCancelado = async () => {
        throw new Error('No se pudo verificar cancelación');
    };
    notificacionService.crearNotificacion = async () => {
        notificacionesCreadas++;
        return { id_notificacion: 1 };
    };

    await assert.rejects(
        handler.manejarEventoActualizado({
            id_evento: 'evt-001',
            id_usuario: 'staff-001',
            nuevo_estado: 'cancelado'
        }),
        /No se pudo verificar cancelación/
    );
    assert.equal(notificacionesCreadas, 0);
});

test('rechaza estados incompatibles con el tipo de evento y fechas de reprogramación inválidas', async () => {
    await assert.rejects(
        handler.manejarEventoActualizado({ id_evento: 'evt-001', nuevo_estado: 'cancelado' }),
        /Debe indicar id_usuario/
    );
    await assert.rejects(
        handler.manejarEventoActualizado({
            id_evento: 'evt-001',
            id_usuario: 'staff-001',
            nuevo_estado: 'publicado'
        }),
        /evento_actualizado debe ser cancelado/
    );
    await assert.rejects(
        handler.manejarEventoReprogramado({
            id_evento: 'evt-001',
            id_usuario: 'staff-001',
            nuevo_estado: 'cancelado',
            fecha_cambio: '2026-09-13',
            hora_cambio: '00:00:00'
        }),
        /evento_reprogramado debe ser publicado/
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

test('rechaza cambios de Panel cuando el evento ya inició, antes de consultar compradores o notificar', async () => {
    let consultasDestinatarios = 0;
    let notificacionesCreadas = 0;
    entradasService.obtenerFechaEvento = async () => ({
        fecha_evento: new Date(Date.now() - 1),
        es_futuro: false
    });
    entradasService.obtenerUsuariosConEntradasActivas = async () => {
        consultasDestinatarios++;
        return [{ id_usuario: 'user-1' }];
    };
    notificacionService.crearNotificacion = async () => {
        notificacionesCreadas++;
        return { id_notificacion: 1 };
    };

    const eventoActualizado = {
        id_evento: 'evt-001',
        id_usuario: 'staff-001',
        nuevo_estado: 'cancelado'
    };
    const eventoReprogramado = {
        ...eventoActualizado,
        nuevo_estado: 'publicado',
        fecha_cambio: '2026-12-01',
        hora_cambio: '19:00:00'
    };

    await assert.rejects(
        handler.manejarEventoActualizado(eventoActualizado),
        /ya inició o finalizó/
    );
    await assert.rejects(
        handler.manejarEventoReprogramado(eventoReprogramado),
        /ya inició o finalizó/
    );
    assert.equal(consultasDestinatarios, 0);
    assert.equal(notificacionesCreadas, 0);
});

test('rechaza cambios de Panel cuando la hora de inicio del evento ya llegó', async () => {
    let consultasDestinatarios = 0;
    entradasService.obtenerFechaEvento = async () => ({
        fecha_evento: new Date(),
        es_futuro: false
    });
    entradasService.obtenerUsuariosConEntradasActivas = async () => {
        consultasDestinatarios++;
        return [];
    };

    await assert.rejects(
        handler.manejarEventoActualizado({
            id_evento: 'evt-001',
            id_usuario: 'staff-001',
            nuevo_estado: 'cancelado'
        }),
        /ya inició o finalizó/
    );
    assert.equal(consultasDestinatarios, 0);
});
