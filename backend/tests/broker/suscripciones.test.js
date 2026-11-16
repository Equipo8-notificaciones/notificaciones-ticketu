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
        await suscribirEvento('ticketu.events', 'recuperacion_cuenta', async payload => {
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
                ['ticketu.events', 'entradas_emitidas'],
                ['ticketu.events', 'recuperacion_cuenta'],
                ['ticketu.events', 'cuenta_staff'],
                ['ticketu.events', 'evento_actualizado'],
                ['ticketu.events', 'evento_reprogramado']
            ]
        );
        for (const suscripcion of suscripciones) {
            await assert.rejects(suscripcion.handler({}));
        }
    } finally {
        broker.subscribeToExchange = originalSubscribeToExchange;
    }
});
