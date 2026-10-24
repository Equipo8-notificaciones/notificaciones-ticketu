const notificacionService = require('../services/notificacionService');
const canalEnvioService = require('../services/canalEnvioService');
const emailService = require('../services/emailService');
const broker = require('../broker');
const { planificarRecordatorio, programarTrabajoRecordatorio } = require('../jobs/notificacionJobs');

const EXCHANGE_CONFIRMACION = 'notificaciones.event';
const ROUTING_KEY_CONFIRMACION = 'notificaciones.confirmacion_envio';

// Procesa la compra recibida desde Entradas/RabbitMQ.
async function manejarEntradaEmitida(evento) {
    validar(evento);
    const {
        correo_comprador: correoComprador,
        nombre_comprador: nombreComprador,
        id_usuario: idUsuario,
        id_evento: idEvento,
        nombre_evento: nombreEvento,
        fecha_evento: fechaEvento,
        hora_evento: horaEvento,
        qr_data: qrData,
        ubicacion_evento: ubicacionEvento
    } = evento;

    await publicarConfirmacion(idUsuario, idEvento, 'en_cola');
    const plan = planificarRecordatorio(fechaEvento, horaEvento);
    const pool = require('../config/database').getPool();
    const fechaPersistir = evento.fecha_evento.includes('T')
        ? evento.fecha_evento
        : `${evento.fecha_evento}T${horaEvento}:00`;

    if (pool) {
        await pool.query(
            `INSERT INTO public.entradas_usuario
                (id_usuario, id_evento, correo_comprador, nombre_evento, fecha_evento)
             VALUES ($1, $2, $3, $4, $5::timestamptz)
             ON CONFLICT (id_usuario, id_evento) DO UPDATE SET
                correo_comprador = EXCLUDED.correo_comprador,
                nombre_evento = EXCLUDED.nombre_evento,
                fecha_evento = EXCLUDED.fecha_evento,
                updated_at = NOW()`,
            [String(idUsuario), String(idEvento), correoComprador, nombreEvento, fechaPersistir]
        );
    }

    const datos = { ...evento };
    const mensajeCompra = `Tu compra para ${nombreEvento} fue procesada. Fecha: ${fechaEvento}, hora: ${horaEvento}.`;
    const notiApp = await notificacionService.crearNotificacion({
        usuarioId: String(idUsuario), tipo: 'COMPRA', mensaje: mensajeCompra, canal: 'APP', datos
    });
    const notiEmail = await notificacionService.crearNotificacion({
        usuarioId: String(idUsuario), tipo: 'COMPRA',
        mensaje: `Confirmación de compra enviada a ${correoComprador}.`, canal: 'EMAIL', datos
    });

    const cuerpo = [
        `Hola ${nombreComprador},`,
        `Tu compra para el evento ${nombreEvento} fue registrada.`,
        `Fecha: ${fechaEvento}`,
        `Hora: ${horaEvento}`,
        `Código QR: ${qrData}`
    ].join('\n');

    let errorApp = null;
    let errorCorreo = null;
    try {
        await notificacionService.enviarConReintentos(
            notiApp.id_notificacion, 'APP', n => canalEnvioService.enviarNotificacion(n), 3
        );
    } catch (error) {
        errorApp = error;
    }
    try {
        await notificacionService.enviarConReintentos(
            notiEmail.id_notificacion, 'EMAIL', () => emailService.enviarCorreo(
                correoComprador, `Confirmación de entrada: ${nombreEvento}`, cuerpo
            ), 3
        );
    } catch (error) {
        errorCorreo = error;
    }

    const estado = errorApp || errorCorreo ? 'error' : 'enviado';

    // Recordatorio APP: si faltan menos de 24 horas, se registra inmediatamente; si no,
    // se programa en memoria para la fecha correspondiente (no sobrevive reinicios del proceso).
    const crearRecordatorio = async () => {
        const recordatorio = await notificacionService.crearNotificacion({
            usuarioId: String(idUsuario),
            tipo: 'RECORDATORIO_24H',
            mensaje: `Recuerda ${nombreEvento} el ${fechaEvento} a las ${horaEvento}${ubicacionEvento ? ` en ${ubicacionEvento}` : ''}.`,
            canal: 'APP',
            datos
        });
        await notificacionService.enviarConReintentos(
            recordatorio.id_notificacion, 'APP', n => canalEnvioService.enviarNotificacion(n), 3
        );
    };
    if (plan.enviarAhora && plan.fechaEvento.getTime() > Date.now()) {
        await crearRecordatorio().catch(error => console.error('[entradaEmitidaHandler] error en recordatorio:', error.message));
    } else if (plan.fechaEnvio && plan.fechaEnvio.getTime() > Date.now()) {
        programarTrabajoRecordatorio(plan.fechaEnvio, crearRecordatorio);
        await publicarConfirmacion(idUsuario, idEvento, 'programado');
    }

    return {
        estado,
        id_usuario: String(idUsuario),
        id_evento: String(idEvento),
        notificacion_app: notiApp,
        notificacion_email: notiEmail,
        estado_correo: errorCorreo ? 'error' : 'exitoso',
        error_correo: errorCorreo?.message,
        estado_app: errorApp ? 'error' : 'exitoso',
        error_app: errorApp?.message
    };
}

async function publicarConfirmacion(idUsuario, idEvento, estado) {
    const payload = {
        id_usuario: String(idUsuario),
        id_evento: String(idEvento),
        estado
    };
    if (typeof broker.publishToExchange !== 'function') {
        throw new Error('El broker debe permitir publicar confirmaciones en un exchange específico.');
    }
    return broker.publishToExchange(EXCHANGE_CONFIRMACION, ROUTING_KEY_CONFIRMACION, payload);
}

function validar(evento) {
    if (!evento || typeof evento !== 'object' || Array.isArray(evento) ||
        (evento.tipo && evento.tipo !== 'entradas_emitidas')) {
        throw new Error('Evento inválido: se esperaba el evento "entradas_emitidas".');
    }
    const requeridos = [
        'correo_comprador', 'nombre_comprador', 'id_usuario', 'nombre_evento', 'id_evento',
        'fecha_evento', 'hora_evento', 'qr_data'
    ];
    for (const campo of requeridos) {
        if (evento[campo] === undefined || evento[campo] === null || String(evento[campo]).trim() === '') {
            throw new Error(`Evento "entradas_emitidas" inválido: falta el campo "${campo}".`);
        }
    }
}

module.exports = { manejarEntradaEmitida };