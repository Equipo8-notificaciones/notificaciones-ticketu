const assert = require('node:assert/strict');
const test = require('node:test');
const broker = require('../../src/broker');
const { iniciarSuscripciones } = require('../../src/broker/suscripciones');

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
                ['auth.events', 'creacion_cuenta'],
                ['panel.evento.notificaciones.v1', 'evento_actualizado'],
                ['panel.evento.notificaciones.v1', 'evento_reprogramdo']
            ]
        );
        for (const suscripcion of suscripciones) {
            await assert.rejects(
                suscripcion.handler({}),
                /event_id único/
            );
        }
    } finally {
        broker.subscribeToExchange = originalSubscribeToExchange;
    }
});
