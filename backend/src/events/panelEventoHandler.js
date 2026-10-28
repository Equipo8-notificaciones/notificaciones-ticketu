const notificacionService = require('../services/notificacionService');
const canalEnvioService = require('../services/canalEnvioService');
const entradasService = require('../services/entradasService');
const recordatorioEventoService = require('../services/recordatorioEventoService');

async function manejarEventoActualizado(evento) {
    validarEvento(evento, false);
    const {
        id_evento: idEvento,
        id_usuario: idUsuario,
        nuevo_estado: estado
    } = evento;
    return procesarEventoPanel({
        idEvento: String(idEvento).trim(),
        idUsuario: String(idUsuario).trim(),
        estado: String(estado).trim().toLowerCase(),
        reprogramado: false
    });
}

async function manejarEventoReprogramado(evento) {
    validarEvento(evento, true);
    const {
        id_evento: idEvento,
        id_usuario: idUsuario,
        nuevo_estado: estado,
        fecha_cambio: fechaCambio,
        hora_cambio: horaCambio
    } = evento;
    return procesarEventoPanel({
        idEvento: String(idEvento).trim(),
        idUsuario: String(idUsuario).trim(),
        estado: String(estado).trim().toLowerCase(),
        fechaCambio,
        horaCambio,
        reprogramado: true
    });
}

async function procesarEventoPanel({
    idEvento,
    idUsuario,
    estado,
    fechaCambio,
    horaCambio,
    reprogramado
}) {
    const { fecha_evento: fechaEventoDb, es_futuro: eventoFuturo } =
        await entradasService.obtenerFechaEvento(idEvento);
    const fechaEvento = new Date(fechaEventoDb);
    if (Number.isNaN(fechaEvento.getTime())) {
        throw new Error(`La fecha_evento almacenada para el evento ${idEvento} no es válida.`);
    }
    if (eventoFuturo !== true) {
        throw new Error(`El evento ${idEvento} ya inició o finalizó; no se procesan cambios de Panel.`);
    }

    let usuarios;
    if (reprogramado) {
        const entradasActualizadas = await entradasService.actualizarFechaEvento(
            idEvento,
            fechaCambio,
            horaCambio
        );
        usuarios = [...new Map(
            entradasActualizadas
                .filter(entrada => entrada.entrada_activa && entrada.id_usuario !== null && entrada.id_usuario !== undefined)
                .map(entrada => [String(entrada.id_usuario), entrada])
        ).values()];

        for (const usuario of usuarios) {
            const datosRecordatorio = {
                id_usuario: String(usuario.id_usuario),
                id_evento: idEvento,
                nombre_evento: usuario.nombre_evento,
                fecha_evento: fechaCambio,
                hora_evento: horaCambio
            };
            await recordatorioEventoService.programarRecordatorioEvento(datosRecordatorio).catch(error => {
                console.error(
                    `[panelEventoHandler] No se pudo reprogramar el recordatorio de ${usuario.id_usuario}:`,
                    error.message
                );
            });
        }
    } else {
        await entradasService.marcarEventoCancelado(idEvento);
        usuarios = await entradasService.obtenerUsuariosConEntradasActivas(idEvento);
    }

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
                mensaje: crearMensaje({
                    idEvento,
                    estado,
                    fechaCambio,
                    horaCambio,
                    reprogramado
                }),
                datos: {
                    id_evento: idEvento,
                    nuevo_estado: estado,
                    nombre_evento: destinatarios.get(idDestinatario)?.nombre_evento,
                    ...(reprogramado && {
                        fecha_evento: fechaCambio,
                        hora_evento: horaCambio
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
    const estadosEsperados = reprogramado ? ['publicado', 'reprogramado'] : ['cancelado'];
    if (!estadosEsperados.includes(estado)) {
        throw new Error(
            `nuevo_estado para ${reprogramado ? 'evento_reprogramado' : 'evento_actualizado'} ` +
            `debe ser ${estadosEsperados.join(' o ')}.`
        );
    }
    if (reprogramado && (!esFechaValida(evento.fecha_cambio) || !esHoraValida(evento.hora_cambio))) {
        throw new Error('evento_reprogramado debe incluir fecha_cambio (AAAA-MM-DD) y hora_cambio (HH:mm[:ss]) válidas.');
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

function crearMensaje({ idEvento, estado, fechaCambio, horaCambio, reprogramado }) {
    if (reprogramado) {
        return `El evento ${idEvento} fue reprogramado para el ${fechaCambio} a las ${horaCambio}.`;
    }
    if (estado === 'cancelado') return `El evento ${idEvento} fue cancelado.`;
    return `El estado del evento ${idEvento} cambió a ${estado}.`;
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
