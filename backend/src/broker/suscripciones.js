const broker = require('./index');
const { manejarEntradaEmitida } = require('../events/entradaEmitidaHandler');
const { manejarRecuperacionCuenta, manejarCrearCuenta } = require('../events/authHandler');
const { manejarEventoActualizado, manejarEventoReprogramado } = require('../events/panelEventoHandler');
const { procesarUnaVez } = require('../services/eventDeduplicationService');

const EXCHANGE = 'ticketu.events';

function suscribirEvento(exchange, routingKey, handler) {
    return broker.subscribeToExchange(exchange, routingKey, evento =>
        procesarUnaVez(exchange, routingKey, evento, () => handler(evento))
    );
}

async function iniciarSuscripciones() {
    await Promise.all([
        suscribirEvento(EXCHANGE, 'entradas_emitidas', manejarEntradaEmitida),
        suscribirEvento(EXCHANGE, 'recuperacion_cuenta', manejarRecuperacionCuenta),
        suscribirEvento(EXCHANGE, 'cuenta_staff', manejarCrearCuenta),
        suscribirEvento(EXCHANGE, 'evento_actualizado', manejarEventoActualizado),
        suscribirEvento(EXCHANGE, 'evento_reprogramado', manejarEventoReprogramado)
    ]);
}

module.exports = { iniciarSuscripciones, suscribirEvento };
