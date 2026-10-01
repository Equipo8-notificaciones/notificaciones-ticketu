const broker = require('./index');
const { manejarEntradaEmitida } = require('../events/entradaEmitidaHandler');
const { manejarRecuperacionCuenta, manejarCrearCuenta } = require('../events/authHandler');
const { manejarEventoActualizado } = require('../events/panelEventoHandler');


//Registra las suscripciones a los eventos consumidos por Notificaciones.
function iniciarSuscripciones() {
    broker.subscribeToExchange('entradas.events', 'entradas_emitidas', manejarEntradaEmitida);
    broker.subscribe('recuperacion_cuenta', manejarRecuperacionCuenta);
    broker.subscribe('cuenta_staff', manejarCrearCuenta);
    broker.subscribe('evento_actualizado', manejarEventoActualizado);
}

module.exports = { iniciarSuscripciones };
