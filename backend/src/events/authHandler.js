const notificacionService = require('../services/notificacionService');
const emailService = require('../services/emailService');
const broker = require('../broker');

const EXCHANGE_NOTIFICACIONES = 'notificaciones.events';

// AUTH publica el evento en el routing key correspondiente. El payload no necesita
// traer un campo "tipo" porque el propio routing key ya identifica la operación.
async function manejarRecuperacionCuenta(evento) {
    return procesarEventoAuth(evento, {
        routingKey: 'recuperacion_cuenta',
        tipoNotificacion: 'RECUPERACION_PASSWORD',
        asunto: 'Restablecer contraseña',
        mensaje: 'Solicitud para restablecer la contraseña'
    });
}

async function manejarCrearCuenta(evento) {
    return procesarEventoAuth(evento, {
        routingKey: 'cuenta_staff',
        tipoNotificacion: 'CREACION_STAFF',
        asunto: 'Cuenta creada de Staff',
        mensaje: 'Se ha creado una cuenta de staff'
    });
}

async function procesarEventoAuth(evento, config) {
    validar(evento, config.routingKey);

    const usuarioId = String(evento.id_usuario ?? evento.email_destino).trim();
    const gmailDestino = String(evento.email_destino).trim();
    const url = String(evento.url || '').trim();

    const notificacion = await notificacionService.crearNotificacion({
        usuarioId,
        tipo: config.tipoNotificacion,
        canal: 'EMAIL',
        mensaje: `${config.mensaje}. Enlace: ${url}`,
        datos: { gmail_destino: gmailDestino, url, origen: 'AUTH' }
    });

    let resultado;
    try {
        await notificacionService.enviarConReintentos(
            notificacion.id_notificacion,
            'EMAIL',
            () => emailService.enviarCorreo(gmailDestino, config.asunto, `${config.mensaje}:\n${url}`),
            3
        );
        resultado = {
            email_destino: gmailDestino,
            estado_envio: 'exitoso'
        };
    } catch (error) {
        resultado = {
            email_destino: gmailDestino,
            estado_envio: 'error',
            Error_envio: error.message
        };
    }

    // Se informa a AUTH tanto si el envío se realizó como si agotó los reintentos.
    await broker.publishToExchange(EXCHANGE_NOTIFICACIONES, 'correo_auth', resultado);
    return { ...resultado, id_notificacion: notificacion.id_notificacion, tipo_notificacion: config.tipoNotificacion };
}

function validar(evento, routingKey) {
    if (!evento || typeof evento !== 'object' || Array.isArray(evento)) {
        throw new Error(`Evento "${routingKey}" inválido: se esperaba un objeto JSON`);
    }
    if (evento.tipo && evento.tipo !== routingKey) {
        throw new Error(`Evento inválido: se esperaba tipo "${routingKey}"`);
    }
    if (typeof evento.email_destino !== 'string' || !evento.email_destino.trim()) {
        throw new Error(`Evento "${routingKey}" inválido: falta el campo "email_destino"`);
    }
    if (typeof evento.url !== 'string' || !evento.url.trim()) {
        throw new Error(`Evento "${routingKey}" inválido: falta el campo "url"`);
    }
    if (routingKey === 'recuperacion_cuenta' &&
        (typeof evento.id_usuario !== 'string' || !evento.id_usuario.trim())) {
        throw new Error('Evento "recuperacion_cuenta" inválido: falta el campo "id_usuario"');
    }
    try {
        const parsed = new URL(evento.url);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocolo inválido');
    } catch {
        throw new Error(`Evento "${routingKey}" inválido: url debe ser una URL http o https`);
    }
}

module.exports = { manejarRecuperacionCuenta, manejarCrearCuenta, procesarEventoAuth };
