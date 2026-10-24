const notificacionService = require('../services/notificacionService');
const canalEnvioService = require('../services/canalEnvioService');
const entradasService = require('../services/entradasService');

const ESTADOS_EVENTO = new Set(['borrador', 'cancelado', 'finalizado', 'publicado']);

async function manejarEventoActualizado(evento) {
    return procesarEventoPanel(evento, false);
}

async function manejarEventoReprogramado(evento) {
    return procesarEventoPanel(evento, true);
}

async function procesarEventoPanel(evento, reprogramado) {
    const { idEvento, idUsuario, estado } = validarEvento(evento, reprogramado);
    const usuarios = await entradasService.obtenerUsuariosConEntradasActivas(idEvento);
    const destinatarios = new Map();
    for (const usuario of usuarios) {
        if (usuario.id_usuario !== null && usuario.id_usuario !== undefined) {
            destinatarios.set(String(usuario.id_usuario), usuario);
        }
    }

    const notificados = [];
    for (const idDestinatario of destinatarios.keys()) {
        try {
            const notificacion = await notificacionService.crearNotificacion({
                id_usuario: idDestinatario,
                tipo: 'EVENTO_CAMBIO',
                canal: 'APP',
                mensaje: crearMensaje(evento, estado, reprogramado),
                datos: {
                    id_evento: idEvento,
                    nuevo_estado: estado,
                    ...(reprogramado && {
                        fecha_cambio: evento.fecha_cambio,
                        hora_cambio: evento.hora_cambio
                    })
                }
            });
            await notificacionService.enviarConReintentos(
                notificacion.id_notificacion,
                'APP',
                n => canalEnvioService.enviarNotificacion(n),
                3
            );
            notificados.push(idDestinatario);
        } catch (error) {
            console.error(`[panelEventoHandler] No se pudo notificar a ${idDestinatario}:`, error.message);
        }
    }

    const totalUsuarios = destinatarios.size;
    const faltantes = totalUsuarios - notificados.length;
    const resultado = {
        id_evento: idEvento,
        nuevo_estado: totalUsuarios > 0 && notificados.length / totalUsuarios > 0.6 ? 'exito' : 'error',
        usuarios_notificados: notificados.length,
        usuarios_faltantes: faltantes,
        fecha_envio: new Date().toISOString()
    };

    await notificarOrganizador(idUsuario, resultado);
    return resultado;
}

function validarEvento(evento, reprogramado) {
    if (!evento || typeof evento !== 'object' || Array.isArray(evento)) {
        throw new Error('Evento de Panel inválido: se esperaba un objeto JSON.');
    }
    const idEvento = String(evento.id_evento ?? '').trim();
    const idUsuario = String(evento.id_usuario ?? '').trim();
    const estado = String(evento.nuevo_estado ?? '').trim().toLowerCase();

    if (!idEvento) throw new Error('Debe indicar id_evento.');
    if (!idUsuario) throw new Error('Debe indicar id_usuario para enviar la confirmación.');
    if (!ESTADOS_EVENTO.has(estado)) {
        throw new Error('nuevo_estado debe ser borrador, cancelado, finalizado o publicado.');
    }
    if (reprogramado && (!esFechaValida(evento.fecha_cambio) || !esHoraValida(evento.hora_cambio))) {
        throw new Error('evento_reprogramdo debe incluir fecha_cambio (AAAA-MM-DD) y hora_cambio (HH:mm[:ss]) válidas.');
    }

    return { idEvento, idUsuario, estado };
}

function esFechaValida(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function esHoraValida(valor) {
    if (typeof valor !== 'string') return false;
    const partes = valor.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    return Boolean(partes &&
        Number(partes[1]) <= 23 &&
        Number(partes[2]) <= 59 &&
        Number(partes[3] ?? 0) <= 59);
}

function crearMensaje(evento, estado, reprogramado) {
    if (reprogramado) {
        return `El evento ${evento.id_evento} fue reprogramado para el ${evento.fecha_cambio} a las ${evento.hora_cambio}.`;
    }
    if (estado === 'cancelado') return `El evento ${evento.id_evento} fue cancelado.`;
    return `El estado del evento ${evento.id_evento} cambió a ${estado}.`;
}

async function notificarOrganizador(idUsuario, resultado) {
    const mensaje = `Proceso de notificaciones del evento ${resultado.id_evento}: ${resultado.nuevo_estado}. ` +
        `Usuarios notificados: ${resultado.usuarios_notificados}; usuarios faltantes: ${resultado.usuarios_faltantes}.`;
    try {
        const notificacion = await notificacionService.crearNotificacion({
            id_usuario: idUsuario,
            tipo: 'EVENTO_CAMBIO',
            canal: 'APP',
            mensaje,
            datos: resultado
        });
        await notificacionService.enviarConReintentos(
            notificacion.id_notificacion,
            'APP',
            n => canalEnvioService.enviarNotificacion(n),
            3
        );
    } catch (error) {
        console.error(`[panelEventoHandler] No se pudo confirmar el resultado a ${idUsuario}:`, error.message);
    }
}

module.exports = { manejarEventoActualizado, manejarEventoReprogramado };
