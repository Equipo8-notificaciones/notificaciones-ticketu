const broker = require('./index');
const { manejarEntradaEmitida } = require('../events/entradaEmitidaHandler');
const { manejarRecuperacionCuenta, manejarCrearCuenta } = require('../events/authHandler');
const { manejarEventoActualizado, manejarReprogramarEvento, manejarCancelarEvento } = require('../events/panelEventoHandler');

// Las suscripciones usan el routing key como identificador del contrato.
async function iniciarSuscripciones() {
    await Promise.all([
        broker.subscribeToExchange('entradas.events', 'entradas_emitidas', manejarEntradaEmitida),
        broker.subscribe('recuperacion_cuenta', manejarRecuperacionCuenta),
        broker.subscribe('cuenta_staff', manejarCrearCuenta),
        broker.subscribe('evento_actualizado', manejarEventoActualizado),
        broker.subscribe('reprogramar_evento', manejarReprogramarEvento),
        broker.subscribe('cancelar_evento', manejarCancelarEvento)
    ]);
}

module.exports = { iniciarSuscripciones };
