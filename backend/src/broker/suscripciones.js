const broker = require('./index');
const { manejarEntradaEmitida } = require('../events/entradaEmitidaHandler');
const { manejarRecuperacionCuenta, manejarCrearCuenta } = require('../events/authHandler');
const { manejarEventoActualizado, manejarEventoReprogramado } = require('../events/panelEventoHandler');
const { procesarUnaVez } = require('../services/eventDeduplicationService');

const EXCHANGE_PANEL = 'panel.evento.notificaciones.v1';
const EXCHANGE_ENTRADAS = 'entradas.events';
const EXCHANGE_AUTH = 'auth.events';

function suscribirEvento(exchange, routingKey, handler) {
    return broker.subscribeToExchange(exchange, routingKey, evento =>
        procesarUnaVez(exchange, routingKey, evento, () => handler(evento))
    );
}

async function iniciarSuscripciones() {
    await Promise.all([
        suscribirEvento(EXCHANGE_ENTRADAS, 'entradas_emitidas', manejarEntradaEmitida),
        suscribirEvento(EXCHANGE_AUTH, 'recuperacion_cuenta', manejarRecuperacionCuenta),
        suscribirEvento(EXCHANGE_AUTH, 'creacion_cuenta', manejarCrearCuenta),
        suscribirEvento(EXCHANGE_PANEL, 'evento_actualizado', manejarEventoActualizado),
        suscribirEvento(EXCHANGE_PANEL, 'evento_reprogramdo', manejarEventoReprogramado)
    ]);
}

module.exports = { iniciarSuscripciones, suscribirEvento };
