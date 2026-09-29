const notificacionService = require('../services/notificacionService');
const canalEnvioService = require('../services/canalEnvioService');
const entradasService = require('../services/entradasService');
const broker = require('../broker');

const MENSAJES_POR_ESTADO = {
    cancelado: (nombreEvento) => `El evento ${nombreEvento || ''} fue cancelado.`.trim(),
    reprogramado: (nombreEvento) => `El evento ${nombreEvento || ''} fue reprogramado.`.trim(),
    finalizado: (nombreEvento) => `El evento ${nombreEvento || ''} ha finalizado.`.trim(),
    borrador: (nombreEvento) => `El evento ${nombreEvento || ''} volvió a estado borrador.`.trim()
};

//Procesa el evento de actualización de un evento

async function manejarEventoActualizado(evento) {
    validar(evento);

    const { id_evento: idEvento, nuevo_estado: nuevoEstado } = evento;

    let usuarios = [];
    let errorObtencionUsuarios = null;

    try {
        // Obtiene los usuarios con entradas activas para el evento.
        usuarios = await entradasService.obtenerUsuariosConEntradasActivas(idEvento);
    } catch (error) {
        errorObtencionUsuarios = error.message;
        console.error('[panelEventoHandler] No se pudo obtener usuarios con entradas activas:', error.message);
    }

    let notificados = 0;
    let faltantes = 0;

    for (const usuarioId of usuarios) {
        try {
            const construirMensaje = MENSAJES_POR_ESTADO[nuevoEstado] || ((n) => `El evento ${n || ''} cambió de estado a ${nuevoEstado}.`);
            const notificacion = await notificacionService.crearNotificacion({
                usuarioId: String(usuarioId),
                tipo: 'EVENTO_CAMBIO',
                titulo: 'Cambio en tu evento',
                mensaje: construirMensaje(evento.nombre_evento),
                datos: { idEvento, nuevoEstado }
            });

            await notificacionService.enviarConReintentos(
                notificacion.id_notificacion,
                (n) => canalEnvioService.enviarNotificacion(n)
            );

            notificados += 1;
        } catch (error) {
            faltantes += 1;
        }
    }

    const respuesta = {
        id_evento: idEvento,
        estado_envio: errorObtencionUsuarios ? 'error' : 'exitoso',
        usuarios_notificados: notificados,
        usuarios_faltantes: faltantes,
        fecha_envio: new Date().toISOString(),
        mensaje: errorObtencionUsuarios
            ? `No se pudo completar el envío: ${errorObtencionUsuarios}`
            : 'Envío realizado correctamente'
    };

    await broker.publish('notificaciones.panel.resultado', respuesta);
    return respuesta;
}

function validar(evento) {
    if (!evento || evento.tipo !== 'evento_actualizado') {
        throw new Error('Evento inválido: se esperaba tipo "evento_actualizado"');
    }
    const requeridos = ['id_evento', 'nuevo_estado'];
    for (const campo of requeridos) {
        if (evento[campo] === undefined || evento[campo] === null) {
            throw new Error(`Evento "evento_actualizado" inválido: falta el campo "${campo}"`);
        }
    }
}

module.exports = { manejarEventoActualizado };
