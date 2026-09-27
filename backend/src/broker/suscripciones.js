const broker = require('./index');
const {
    manejarEntradaEmitida,
    procesarEnvioCorreoEntradaEmitida,
    TOPICO_INTERNO_ENVIO_CORREO
} = require('../events/entradaEmitidaHandler');
const { manejarRecuperacionCuenta, manejarCuentaStaff } = require('../events/authHandler');
const { manejarEventoActualizado } = require('../events/panelEventoHandler');


//Registra los eventos que escucha Notificaciones
function iniciarSuscripciones() {
    broker.subscribe('entrada_emitida', manejarEntradaEmitida);
    broker.subscribe('recuperacion_cuenta', manejarRecuperacionCuenta);
    broker.subscribe('cuenta_staff', manejarCuentaStaff);
    broker.subscribe('panel.evento.actualizado', manejarEventoActualizado);

    // Procesa el envío interno de la notificación de compra.
    broker.subscribe(TOPICO_INTERNO_ENVIO_CORREO, procesarEnvioCorreoEntradaEmitida);
}

module.exports = { iniciarSuscripciones };
