const broker = require('./index');
const { manejarEntradaEmitida } = require('../events/entradaEmitidaHandler');
const { manejarRecuperacionCuenta, manejarCrearCuenta } = require('../events/authHandler');
const { manejarEventoActualizado, manejarEventoReprogramado } = require('../events/panelEventoHandler');
const { procesarUnaVez } = require('../services/eventDeduplicationService');

const EXCHANGE_ENTRADAS = 'entradas.events';
const EXCHANGE_AUTH = 'auth.events';
const EXCHANGE_PANEL = 'panel.evento.notificaciones.v1';
const TOPICO_PANEL = 'panel.evento.notificaciones.v1';
const handlersPanel = new Map([
    ['evento_actualizado', manejarEventoActualizado],
    ['evento_reprogramado', manejarEventoReprogramado]
]);

function suscribirEvento(exchange, routingKey, handler) {
    return broker.subscribeToExchange(exchange, routingKey, evento =>
        procesarUnaVez(exchange, routingKey, evento, () => handler(evento))
    );
}

function procesarEventoPanel(evento, propiedades = {}) {
    const tipo = propiedades.type ?? propiedades.headers?.tipo;
    const handler = handlersPanel.get(tipo);
    if (!handler) {
        throw new Error('Tipo de evento de Panel ausente o no soportado.');
    }
    return procesarUnaVez(EXCHANGE_PANEL, tipo, evento, () => handler(evento));
}

async function iniciarSuscripciones() {
    await Promise.all([
        suscribirEvento(EXCHANGE_ENTRADAS, 'entradas_emitidas', manejarEntradaEmitida),
        suscribirEvento(EXCHANGE_AUTH, 'recuperacion_cuenta', manejarRecuperacionCuenta),
        suscribirEvento(EXCHANGE_AUTH, 'cuenta_staff', manejarCrearCuenta),
        broker.subscribeToExchange(EXCHANGE_PANEL, TOPICO_PANEL, procesarEventoPanel)
    ]);
}

module.exports = { iniciarSuscripciones, suscribirEvento };
