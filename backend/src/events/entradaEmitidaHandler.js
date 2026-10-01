const notificacionService = require('../services/notificacionService');
const canalEnvioService = require('../services/canalEnvioService');
const emailService = require('../services/emailService');
const broker = require('../broker');
const {
    planificarRecordatorio,
    formatearFechaEvento,
    programarTrabajoRecordatorio
} = require('../jobs/notificacionJobs');

// Procesa entradas_emitidas: confirma la compra por correo y programa el recordatorio web.
async function manejarEntradaEmitida(evento) {
    validar(evento);

    const {
        correo_comprador: correoComprador,
        nombre_comprador: nombreComprador,
        id_evento: idEvento,
        nombre_evento: nombreEvento,
        fecha_evento: fechaEvento,
        hora_evento: horaEvento,
        qr_data: qrData
    } = evento;

    const plan = planificarRecordatorio(fechaEvento, horaEvento);
    if (plan.fechaEvento.getTime() <= Date.now()) {
        throw new Error('No se puede programar un recordatorio para un evento que ya ocurrió.');
    }

    const fechaEventoFormateada = formatearFechaEvento(fechaEvento);
    const cuerpoCorreo = [
        `Hola ${nombreComprador},`,
        `Tu compra para el evento ${nombreEvento} fue registrada.`,
        `Fecha del evento: ${fechaEventoFormateada}`,
        `Hora: ${horaEvento}`,
        `Código QR: ${qrData}`
    ].join('\n');

    let resultadoCorreo;
    let errorCorreo;
    try {
        resultadoCorreo = await emailService.enviarCorreoConReintentos(
            correoComprador,
            `Confirmación de entrada: ${nombreEvento}`,
            cuerpoCorreo
        );
    } catch (error) {
        errorCorreo = error;
    }

    const estadoCorreo = errorCorreo
        ? 'error'
        : resultadoCorreo.simulado ? 'simulado' : 'enviado';

    const emitirNotificacionWeb = async () => {
        const notificacion = await notificacionService.crearNotificacion({
            usuarioId: correoComprador,
            tipo: 'RECORDATORIO',
            titulo: `Recordatorio del evento ${nombreEvento}`,
            mensaje: `Hola ${nombreComprador}, recuerda tu evento ${nombreEvento} el ${fechaEventoFormateada} a las ${horaEvento}.`,
            datos: {
                correoComprador,
                nombreComprador,
                idEvento,
                nombreEvento,
                fechaEvento: fechaEventoFormateada,
                horaEvento,
                qrData
            }
        });

        return notificacionService.enviarConReintentos(
            notificacion.id_notificacion,
            (n) => canalEnvioService.enviarNotificacion(n)
        );
    };

    if (plan.enviarAhora) {
        let notificacion;
        try {
            notificacion = await emitirNotificacionWeb();
        } catch (error) {
            await publicarConfirmacion('error', error.message);
            throw error;
        }

        const mensajeCorreo = errorCorreo
            ? `Falló el correo inmediato para ${correoComprador}: ${errorCorreo.message}.`
            : `Correo ${estadoCorreo} inmediatamente para ${correoComprador}.`;
        await publicarConfirmacion(
            errorCorreo ? 'error' : estadoCorreo,
            `${mensajeCorreo} Recordatorio web emitido.`
        );
        return {
            estado: errorCorreo ? 'error' : estadoCorreo,
            correo: estadoCorreo,
            error_correo: errorCorreo?.message,
            notificacion
        };
    }

    programarTrabajoRecordatorio(plan.fechaEnvio, async () => {
        try {
            await emitirNotificacionWeb();
            await publicarConfirmacion(
                'enviado',
                `Recordatorio web emitido para ${nombreEvento} el ${fechaEventoFormateada}.`
            );
        } catch (error) {
            await publicarConfirmacion('error', error.message);
            throw error;
        }
    });

    const fechaEnvio = `${fechaEventoFormateada} ${horaEvento}`;
    const mensaje = errorCorreo
        ? `Falló el correo inmediato para ${correoComprador}: ${errorCorreo.message}. Recordatorio web programado para 24 horas antes.`
        : `Correo ${estadoCorreo} inmediatamente para ${correoComprador}. Recordatorio web programado para ${fechaEnvio} menos 24 horas.`;
    await publicarConfirmacion(errorCorreo ? 'error' : estadoCorreo, mensaje);
    return {
        estado: 'programado',
        correo: estadoCorreo,
        error_correo: errorCorreo?.message,
        fecha_envio: plan.fechaEnvio.toISOString(),
        mensaje
    };
}

async function publicarConfirmacion(estado, mensaje) {
    const payload = { estado, mensaje };
    if (broker.publishToExchange) {
        return broker.publishToExchange('notificaciones.events', 'notificaciones.confirmacion_envio', payload);
    }
    return broker.publish('notificaciones.confirmacion_envio', payload);
}

function validar(evento) {
    if (!evento || (evento.tipo && evento.tipo !== 'entradas_emitidas')) {
        throw new Error('Evento inválido: se esperaba tipo "entradas_emitidas"');
    }
    const requeridos = [
        'correo_comprador', 'nombre_comprador', 'nombre_evento', 'id_evento',
        'fecha_evento', 'hora_evento', 'qr_data'
    ];
    for (const campo of requeridos) {
        if (evento[campo] === undefined || evento[campo] === null) {
            throw new Error(`Evento "entrada_emitida" inválido: falta el campo "${campo}"`);
        }
    }
}

module.exports = { manejarEntradaEmitida };
