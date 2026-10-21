const notificacionService = require('../services/notificacionService');
const emailService = require('../services/emailService');
const broker = require('../broker');

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

    const usuarioIdRecibido = evento.Id_usuario ?? evento.id_usuario ?? evento.usuarioId;
    const emailDestino = String(evento.email_destino || '').trim();
    const url = String(evento.url || '').trim();
    // El contrato de cuenta_staff no trae id_usuario; se usa el correo como identificador
    // provisional para cumplir id_usuario NOT NULL sin alterar el contrato de AUTH.
    const usuarioId = String(usuarioIdRecibido ?? emailDestino).trim();

    const notificacion = await notificacionService.crearNotificacion({
        usuarioId,
        tipo: config.tipoNotificacion,
        canal: 'EMAIL',
        mensaje: `${config.mensaje}. Enlace: ${url}`,
        datos: { email_destino: emailDestino, url, origen: 'AUTH' }
    });

    let resultado;
    try {
        await notificacionService.enviarConReintentos(
            notificacion.id_notificacion,
            'EMAIL',
            () => emailService.enviarCorreo(emailDestino, config.asunto, `${config.mensaje}:\n${url}`),
            3
        );
        resultado = {
            email_destino: emailDestino,
            estado_envio: 'exitoso'
        };
    } catch (error) {
        resultado = {
            email_destino: emailDestino,
            gmail_destino: emailDestino, // alias para consumidores que esperan el nombre del ejemplo anterior
            estado_envio: 'error',
            error_envio: error.message
        };
    }

    // Se informa a AUTH tanto si el envío se realizó como si agotó los reintentos.
    await broker.publish('notificaciones.auth.resultado', resultado);
    return { ...resultado, id_notificacion: notificacion.id_notificacion, tipo_notificacion: config.tipoNotificacion };
}

function validar(evento, routingKey) {
    if (!evento || typeof evento !== 'object' || Array.isArray(evento)) {
        throw new Error(`Evento "${routingKey}" inválido: se esperaba un objeto JSON`);
    }
    if (evento.tipo && evento.tipo !== routingKey) {
        throw new Error(`Evento inválido: se esperaba tipo "${routingKey}"`);
    }
    if (!evento.email_destino || !String(evento.email_destino).trim()) {
        throw new Error(`Evento "${routingKey}" inválido: falta el campo "email_destino"`);
    }
    if (!evento.url || !String(evento.url).trim()) {
        throw new Error(`Evento "${routingKey}" inválido: falta el campo "url"`);
    }
    if (routingKey === 'recuperacion_cuenta' && evento.Id_usuario == null && evento.id_usuario == null && evento.usuarioId == null) {
        throw new Error('Evento "recuperacion_cuenta" inválido: falta el campo "Id_usuario"');
    }
    try {
        const parsed = new URL(String(evento.url));
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocolo inválido');
    } catch {
        throw new Error(`Evento "${routingKey}" inválido: url debe ser una URL http o https`);
    }
}

module.exports = { manejarRecuperacionCuenta, manejarCrearCuenta, procesarEventoAuth };
