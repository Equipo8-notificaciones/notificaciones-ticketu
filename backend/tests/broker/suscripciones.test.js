const assert = require('node:assert/strict');
const test = require('node:test');
const broker = require('../../src/broker');
const {
    iniciarSuscripciones,
    suscribirEvento,
    manejarMensajePanel,
    PANEL_ROUTING_KEY,
    PANEL_QUEUE
} = require('../../src/broker/suscripciones');
const panelHandler = require('../../src/events/panelEventoHandler');

test('suscripciones genéricas deduplican sin cambiar payload ni exigir event_id', async () => {
    let consumirEvento;
    const originalSubscribeToExchange = broker.subscribeToExchange;
    broker.subscribeToExchange = async (exchange, routingKey, handler) => {
        consumirEvento = handler;
    };

    try {
        const evento = {
            id_usuario: 'usr-1',
            email_destino: 'usuario@ejemplo.com',
            url: 'https://ticketu.cl/restablecer?token=abc'
        };
        let recibido;
        let ejecuciones = 0;
        await suscribirEvento('auth.events', 'recuperacion_cuenta', async payload => {
            ejecuciones++;
            recibido = payload;
        });
        await consumirEvento(evento);
        await consumirEvento({ ...evento });
        assert.equal(recibido, evento);
        assert.equal(ejecuciones, 1);
    } finally {
        broker.subscribeToExchange = originalSubscribeToExchange;
    }
});

test('registra Entradas, Auth y una suscripción Panel compatible con AMQP type', async () => {
    const suscripciones = [];
    const originalSubscribeToExchange = broker.subscribeToExchange;
    const originalSubscribePanel = broker.subscribePanelEvents;
    broker.subscribeToExchange = async (exchange, routingKey, handler) => {
        suscripciones.push({ exchange, routingKey, handler });
    };
    broker.subscribePanelEvents = async options => suscripciones.push({ panel: true, ...options });

    try {
        await iniciarSuscripciones();
        assert.deepEqual(
            suscripciones.filter(item => !item.panel).map(({ exchange, routingKey }) => [exchange, routingKey]),
            [
                ['entradas.events', 'entradas_emitidas'],
                ['auth.events', 'recuperacion_cuenta'],
                ['auth.events', 'cuenta_staff']
            ]
        );
        const panel = suscripciones.find(item => item.panel);
        assert.ok(panel);
        assert.deepEqual(panel.exchanges, ['ticketu.events', 'panel.evento.notificaciones.v1']);
        assert.equal(panel.routingKey, 'panel.evento.notificaciones.v1');
        assert.equal(panel.queueName, 'notificaciones.panel_eventos.v1');
        for (const suscripcion of suscripciones.filter(item => !item.panel)) {
            await assert.rejects(suscripcion.handler({}));
        }
    } finally {
        broker.subscribeToExchange = originalSubscribeToExchange;
        broker.subscribePanelEvents = originalSubscribePanel;
    }
});

test('Panel deduplica por messageId y procesa cambios distintos aunque el payload coincida', async () => {
    const originalActualizado = panelHandler.manejarEventoActualizado;
    const llamadas = [];
    panelHandler.manejarEventoActualizado = async payload => { llamadas.push(payload); };

    try {
        const payload = { id_evento: 'evt-panel-idempotencia', id_usuario: 'usr-staff', nuevo_estado: 'cancelado' };
        await manejarMensajePanel(payload, { type: 'evento_actualizado', messageId: 'outbox-1' });
        await manejarMensajePanel(payload, { type: 'evento_actualizado', messageId: 'outbox-1' });
        await manejarMensajePanel(payload, { type: 'evento_actualizado', messageId: 'outbox-2' });
        assert.equal(llamadas.length, 2);
    } finally {
        panelHandler.manejarEventoActualizado = originalActualizado;
    }
});

test('Panel enruta por la propiedad AMQP type y acepta payload plano', async () => {
    const originalActualizado = panelHandler.manejarEventoActualizado;
    const originalReprogramado = panelHandler.manejarEventoReprogramado;
    const llamadas = [];
    panelHandler.manejarEventoActualizado = async payload => { llamadas.push(['actualizado', payload]); };
    panelHandler.manejarEventoReprogramado = async payload => { llamadas.push(['reprogramado', payload]); };

    try {
        const payloadCancelacion = { id_evento: 'evt-1', id_usuario: 'usr-staff', nuevo_estado: 'CANCELADO' };
        const payloadReprogramacion = {
            id_evento: 'evt-2', id_usuario: 'usr-staff', nuevo_estado: 'PUBLICADO',
            fecha_cambio: '2026-12-13', hora_cambio: '20:00:00'
        };
        await manejarMensajePanel(payloadCancelacion, { type: 'evento_actualizado' });
        await manejarMensajePanel(payloadCancelacion, { type: 'evento_actualizado' }); // entrega duplicada
        await manejarMensajePanel(payloadReprogramacion, { type: 'evento_reprogramado' });
        assert.deepEqual(llamadas, [
            ['actualizado', payloadCancelacion],
            ['reprogramado', payloadReprogramacion]
        ]);
        await assert.rejects(
            manejarMensajePanel(payloadCancelacion, { type: 'routing_key_sin_tipo' }),
            /Tipo AMQP de Panel no reconocido/
        );
    } finally {
        panelHandler.manejarEventoActualizado = originalActualizado;
        panelHandler.manejarEventoReprogramado = originalReprogramado;
    }
});
