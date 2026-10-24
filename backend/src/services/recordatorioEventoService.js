const notificacionService = require('./notificacionService');
const canalEnvioService = require('./canalEnvioService');
const entradasService = require('./entradasService');
const { planificarRecordatorio, programarTrabajoRecordatorio } = require('../jobs/notificacionJobs');

async function enviarRecordatorioEvento(datos) {
    const { id_usuario, nombre_evento, fecha_evento, hora_evento, ubicacion_evento } = datos;
    const estado = await entradasService.obtenerEstadoRecordatorio(id_usuario, datos.id_evento);
    if (String(estado.estado_evento).toUpperCase() === 'CANCELADO') {
        return { enviado: false, motivo: 'evento_cancelado' };
    }
    if (estado.evento_futuro !== true) {
        return { enviado: false, motivo: 'evento_no_futuro' };
    }

    const notificacion = await notificacionService.crearNotificacion({
        usuarioId: String(id_usuario),
        tipo: 'RECORDATORIO_24H',
        mensaje: `Recuerda ${nombre_evento} el ${fecha_evento} a las ${hora_evento}${ubicacion_evento ? ` en ${ubicacion_evento}` : ''}.`,
        canal: 'APP',
        datos
    });
    await notificacionService.enviarConReintentos(
        notificacion.id_notificacion,
        'APP',
        n => canalEnvioService.enviarNotificacion(n),
        3
    );
    return { enviado: true };
}

async function programarRecordatorioEvento(datos) {
    const plan = planificarRecordatorio(datos.fecha_evento, datos.hora_evento);
    if (plan.enviarAhora) {
        if (plan.fechaEvento.getTime() > Date.now()) {
            await enviarRecordatorioEvento(datos);
        }
        return { programado: false, enviarAhora: plan.fechaEvento.getTime() > Date.now() };
    }

    const clave = `${datos.id_usuario}:${datos.id_evento}`;
    programarTrabajoRecordatorio(
        clave,
        plan.fechaEnvio,
        () => enviarRecordatorioEvento(datos)
    );
    return { programado: true, enviarAhora: false };
}

module.exports = { programarRecordatorioEvento, enviarRecordatorioEvento };
