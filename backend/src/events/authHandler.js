const emailService = require('../services/emailService');
const broker = require('../broker');

const EXCHANGE_NOTIFICACIONES = 'notificaciones.events';
const CONFIG_RECUPERACION_CUENTA = {
    routingKey: 'recuperacion_cuenta',
    asunto: 'Restablecer contraseña',
    mensaje: 'Solicitud para restablecer la contraseña'
};
const CONFIG_CUENTA_STAFF = {
    routingKey: 'cuenta_staff',
    asunto: 'Cuenta creada de Staff',
    mensaje: 'Se ha creado una cuenta de staff'
};

// Maneja el evento de recuperación de cuenta recibido desde Auth/RabbitMQ
async function manejarRecuperacionCuenta(evento) {
    validar(evento, CONFIG_RECUPERACION_CUENTA.routingKey);
    const {
        email_destino: emailDestino,
        url
    } = evento;
    return procesarEventoAuth(emailDestino, url, CONFIG_RECUPERACION_CUENTA);
}

async function manejarCrearCuenta(evento) {
    validar(evento, CONFIG_CUENTA_STAFF.routingKey);
    const {
        email_destino: emailDestino,
        url
    } = evento;
    return procesarEventoAuth(emailDestino, url, CONFIG_CUENTA_STAFF);
}

async function procesarEventoAuth(emailDestino, url, config) {
    const {
        routingKey,
        asunto,
        mensaje
    } = config;

    const emailDestinoNormalizado = String(emailDestino).trim();
    const urlNormalizada = String(url).trim();

    let resultado;
    try {
        await emailService.enviarCorreoConReintentos(
            emailDestinoNormalizado,
            asunto,
            `${mensaje}:\n${urlNormalizada}`,
            3
        );
        resultado = {
            email_destino: emailDestinoNormalizado,
            estado_envio: 'exitoso'
        };
    } catch (error) {
        resultado = {
            email_destino: emailDestinoNormalizado,
            estado_envio: 'error',
            error_envio: error.message
        };
    }

    await broker.publishToExchange(EXCHANGE_NOTIFICACIONES, 'correo_auth', resultado);
    return resultado;
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
