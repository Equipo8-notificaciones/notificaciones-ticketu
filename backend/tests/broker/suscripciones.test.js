const assert = require('node:assert/strict');
const test = require('node:test');
const broker = require('../../src/broker');
const { iniciarSuscripciones, suscribirEvento } = require('../../src/broker/suscripciones');

test('suscripciones deduplican eventos sin cambiar el payload recibido ni exigir event_id', async () => {
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

test('deduplica los routing keys suscritos de Entradas, AUTH y Panel', async () => {
    const suscripciones = [];
    const originalSubscribeToExchange = broker.subscribeToExchange;
    broker.subscribeToExchange = async (exchange, routingKey, handler) => {
        suscripciones.push({ exchange, routingKey, handler });
    };

    try {
        await iniciarSuscripciones();
        assert.deepEqual(
            suscripciones.map(({ exchange, routingKey }) => [exchange, routingKey]),
            [
                ['entradas.events', 'entradas_emitidas'],
                ['auth.events', 'recuperacion_cuenta'],
                ['auth.events', 'cuenta_staff'],
                ['panel.evento.notificaciones.v1', 'panel.evento.notificaciones.v1']
            ]
        );
        for (const suscripcion of suscripciones.slice(0, -1)) {
            await assert.rejects(suscripcion.handler({}));
        }
        const panel = suscripciones.at(-1).handler;
        assert.throws(() => panel({}), /Tipo de evento de Panel ausente/);
        await assert.rejects(
            panel({ id_evento: 'evento', id_usuario: 'organizador', nuevo_estado: 'publicado' },
                { type: 'evento_actualizado' }),
            /evento_actualizado debe ser cancelado/
        );
        await assert.rejects(
            panel({ id_evento: 'evento', id_usuario: 'organizador', nuevo_estado: 'cancelado' },
                { headers: { tipo: 'evento_reprogramado' } }),
            /evento_reprogramado debe ser publicado o reprogramado/
        );
    } finally {
        broker.subscribeToExchange = originalSubscribeToExchange;
    }
});
