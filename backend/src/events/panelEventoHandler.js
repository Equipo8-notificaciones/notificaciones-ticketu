const notificacionService = require('../services/notificacionService');
const canalEnvioService = require('../services/canalEnvioService');
const entradasService = require('../services/entradasService');
const broker = require('../broker');

async function manejarReprogramarEvento(evento) {
    validarBase(evento);
    const idEvento = String(evento.id_evento);
    const fechaEntrada = evento.nueva_fecha_evento ?? evento.fecha_evento;
    if (!fechaEntrada || Number.isNaN(new Date(fechaEntrada).getTime())) {
        throw new Error('Debe enviar nueva_fecha_evento como fecha/hora válida (ISO 8601 recomendado).');
    }

    const filasActualizadas = await entradasService.reprogramarEvento(idEvento, new Date(fechaEntrada).toISOString());
    const fechaAnterior = filasActualizadas[0]?.fecha_anterior ?? evento.fecha_anterior ?? null;
    const fechaAnteriorISO = fechaAnterior
        ? new Date(fechaAnterior).toISOString()
        : null;
    const activas = filasActualizadas.filter(fila => fila.entrada_activa);
    const nombreEvento = evento.nombre_evento || filasActualizadas[0]?.nombre_evento || idEvento;
    const resumen = await notificarUsuarios({
        idEvento,
        filas: activas,
        tipo: 'CAMBIO_EVENTO',
        mensaje: `El evento ${nombreEvento} fue reprogramado. Nueva fecha: ${new Date(fechaEntrada).toLocaleString('es-CL', { timeZone: 'America/Santiago' })}.`,
        datos: {
            id_evento: idEvento,
            nombre_evento: nombreEvento,
            fecha_anterior: fechaAnteriorISO,
            nueva_fecha_evento: new Date(fechaEntrada).toISOString(),
            estado_evento: 'REPROGRAMADO'
        }
    });
    return publicarResultado(resumen);
}

async function manejarCancelarEvento(evento) {
    validarBase(evento);
    const idEvento = String(evento.id_evento);
    const filasActualizadas = await entradasService.cancelarEvento(idEvento);
    const activas = filasActualizadas.filter(fila => fila.entrada_activa);
    const nombreEvento = evento.nombre_evento || filasActualizadas[0]?.nombre_evento || idEvento;
    const resumen = await notificarUsuarios({
        idEvento,
        filas: activas,
        tipo: 'CANCELACION_EVENTO',
        mensaje: `El evento ${nombreEvento} fue cancelado.`,
        datos: {
            id_evento: idEvento,
            nombre_evento: nombreEvento,
            estado_evento: 'CANCELADO',
            motivo: evento.motivo || null
        }
    });
    return publicarResultado(resumen);
}

// Compatibilidad con el mensaje legado "evento_actualizado" de Panel.
async function manejarEventoActualizado(evento) {
    validarBase(evento);
    const estado = String(evento.nuevo_estado || evento.estado_evento || '').toUpperCase();
    if (estado === 'CANCELADO' || estado === 'CANCELACION_EVENTO') {
        return manejarCancelarEvento({ ...evento, id_evento: evento.id_evento });
    }
    if (estado === 'REPROGRAMADO' || estado === 'CAMBIO_EVENTO') {
        return manejarReprogramarEvento({
            ...evento,
            id_evento: evento.id_evento,
            nueva_fecha_evento: evento.nueva_fecha_evento ?? evento.fecha_evento
        });
    }
    throw new Error('evento_actualizado debe indicar nuevo_estado CANCELADO o REPROGRAMADO; para reprogramar incluya nueva_fecha_evento.');
}

async function notificarUsuarios({ idEvento, filas, tipo, mensaje, datos }) {
    let notificados = 0;
    let noNotificados = 0;

    for (const fila of filas) {
        let notificacion;
        try {
            notificacion = await notificacionService.crearNotificacion({
                usuarioId: String(fila.id_usuario),
                tipo,
                canal: 'APP',
                mensaje,
                datos: { ...datos, correo_comprador: fila.correo_comprador }
            });
            await notificacionService.enviarConReintentos(
                notificacion.id_notificacion,
                'APP',
                n => canalEnvioService.enviarNotificacion(n),
                3
            );
            notificados++;
        } catch (error) {
            noNotificados++;
            console.error(`[panelEventoHandler] No se pudo notificar a ${fila.id_usuario}:`, error.message);
        }
    }

    const ahora = new Date();
    const fechaEnvio = ahora.toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
    });

    return {
        tipo_respuesta: 'evento_actualizado',
        id_evento: idEvento,
        titulo: 'Evento actualizado',
        mensaje: 'El estado del evento ha sido actualizado correctamente.',
        estado_envio: noNotificados === 0 ? 'exitoso' : (notificados > 0 ? 'parcial' : 'error'),
        usuarios_notificados: notificados,
        usuarios_no_notificados: noNotificados,
        fecha_envio: fechaEnvio,
        fecha_envio_iso: ahora.toISOString()
    };
}

async function publicarResultado(resumen) {
    // El resultado queda disponible para Panel y también para AUTH, según el contrato solicitado.
    // Si el broker no está disponible, la respuesta HTTP sigue devolviendo el resumen ya calculado.
    for (const topic of ['notificaciones.panel.resultado', 'notificaciones.auth.resultado']) {
        try {
            await broker.publish(topic, resumen);
        } catch (error) {
            console.error(`[panelEventoHandler] No se pudo publicar ${topic}:`, error.message);
        }
    }
    return resumen;
}

function validarBase(evento) {
    if (!evento || typeof evento !== 'object' || Array.isArray(evento)) {
        throw new Error('Evento de PANEL inválido: se esperaba un objeto JSON.');
    }
    if (!evento.id_evento || !String(evento.id_evento).trim()) {
        throw new Error('Debe indicar id_evento.');
    }
}

module.exports = { manejarEventoActualizado, manejarReprogramarEvento, manejarCancelarEvento };
