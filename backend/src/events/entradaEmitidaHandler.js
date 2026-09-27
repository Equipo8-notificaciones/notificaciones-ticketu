const notificacionService = require('../services/notificacionService');
const canalEnvioService = require('../services/canalEnvioService');
const broker = require('../broker');
const { crearTrabajoRecordatorio } = require('../jobs/notificacionJobs');

const VEINTICUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

//Tópico interno para procesar el envío de la notificación de compra
const TOPICO_INTERNO_ENVIO_CORREO = 'notificaciones.interno.entrada_emitida.enviar_correo';


//Procesa el evento de entrada emitida.
async function manejarEntradaEmitida(evento) {
    validar(evento);

    const {
        id_usuario: usuarioId,
        id_evento: idEvento,
        nombre_evento: nombreEvento,
        fecha_evento: fechaEvento,
        cantidad_entradas: cantidadEntradas,
        fecha_emision: fechaEmision
    } = evento;

    const notificacion = await notificacionService.crearNotificacion({
        usuarioId,
        tipo: 'COMPRA',
        titulo: `Tienes ${cantidadEntradas} entrada(s) para ${nombreEvento}`,
        mensaje: `Tienes ${cantidadEntradas} entrada(s) para ${nombreEvento}...`,
        datos: { idEvento, nombreEvento, fechaEvento, cantidadEntradas, fechaEmision }
    });

    // Encola el envío de la notificación de compra
    await broker.publish(TOPICO_INTERNO_ENVIO_CORREO, {
        id_notificacion: notificacion.id_notificacion
    });

    // Genera el trabajo de recordatorio.
    crearTrabajoRecordatorio({
        usuarioId,
        idEvento,
        nombreEvento,
        fechaEvento,
        momento: calcularMomentoRecordatorio(fechaEvento)
    });

    return notificacion;
}


//Procesa el envío asíncrono de la notificación de compra
async function procesarEnvioCorreoEntradaEmitida(mensaje) {
    const { id_notificacion: idNotificacion } = mensaje || {};
    if (!idNotificacion) {
        console.error('[entradaEmitidaHandler] Mensaje interno de envío de correo sin id_notificacion');
        return;
    }

    try {
        await notificacionService.enviarConReintentos(
            idNotificacion,
            (n) => canalEnvioService.enviarNotificacion(n)
        );
    } catch (error) {
        console.error(`[entradaEmitidaHandler] Falló el envío de la notificación ${idNotificacion}:`, error.message);
    }
}

//Determina cuándo debe ejecutarse el recordatorio
function calcularMomentoRecordatorio(fechaEvento) {
    const fechaEventoMs = new Date(fechaEvento).getTime();

    if (Number.isNaN(fechaEventoMs)) {
        return '24H_ANTES';
    }

    const anticipacionMs = fechaEventoMs - Date.now();
    return anticipacionMs < VEINTICUATRO_HORAS_MS ? 'INMEDIATO' : '24H_ANTES';
}

function validar(evento) {
    if (!evento || evento.tipo !== 'entrada_emitida') {
        throw new Error('Evento inválido: se esperaba tipo "entrada_emitida"');
    }
    const requeridos = ['id_usuario', 'id_evento', 'nombre_evento', 'fecha_evento', 'cantidad_entradas'];
    for (const campo of requeridos) {
        if (evento[campo] === undefined || evento[campo] === null) {
            throw new Error(`Evento "entrada_emitida" inválido: falta el campo "${campo}"`);
        }
    }
    // fecha_emision es opcional
}

module.exports = {
    manejarEntradaEmitida,
    procesarEnvioCorreoEntradaEmitida,
    TOPICO_INTERNO_ENVIO_CORREO
};
