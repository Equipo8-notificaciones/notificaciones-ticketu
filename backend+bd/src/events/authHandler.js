const notificacionService = require('../services/notificacionService');
const emailService = require('../services/emailService');


//Procesa los eventos publicados por Auth en el exchange "auth_events"
//Notificaciones solo consume "recuperacion_cuenta" y "cuenta_staff"

//Evento "recuperacion_cuenta"
//Payload: { Id_usuario, email_destino, url }
async function manejarRecuperacionCuenta(evento) {
    validarRecuperacionCuenta(evento);

    return procesarEventoAuth({
        usuarioId: String(evento.Id_usuario),
        emailDestino: evento.email_destino,
        url: evento.url,
        tituloNotificacion: 'Restablecer contraseña'
    });
}

//Evento "cuenta_staff"
//Payload: { email_destino, url }
//El contrato no incluye Id_usuario ni rol
async function manejarCuentaStaff(evento) {
    validarCuentaStaff(evento);

    return procesarEventoAuth({
        usuarioId: String(evento.email_destino),
        emailDestino: evento.email_destino,
        url: evento.url,
        tituloNotificacion: 'Cuenta creada de Staff'
    });
}

//Crea la notificación y envía el correo con reintentos
async function procesarEventoAuth({ usuarioId, emailDestino, url, tituloNotificacion }) {
    const notificacion = await notificacionService.crearNotificacion({
        usuarioId,
        tipo: 'RECUPERACION_PASSWORD',
        titulo: tituloNotificacion,
        mensaje: `${tituloNotificacion}: ${url}`,
        datos: { url }
    });

    try {
        await notificacionService.enviarConReintentos(
            notificacion.id_notificacion,
            () => emailService.enviarCorreo(emailDestino, tituloNotificacion, url)
        );
    } catch (error) {
        console.error(`[authHandler] Falló el envío de la notificación ${notificacion.id_notificacion}:`, error.message);
    }

    return notificacion;
}

function validarRecuperacionCuenta(evento) {
    validarCamposRequeridos(evento, 'recuperacion_cuenta', ['Id_usuario', 'email_destino', 'url']);
}

function validarCuentaStaff(evento) {
    validarCamposRequeridos(evento, 'cuenta_staff', ['email_destino', 'url']);
}

function validarCamposRequeridos(evento, nombreEvento, requeridos) {
    if (!evento || typeof evento !== 'object') {
        throw new Error(`Evento "${nombreEvento}" inválido: el payload debe ser un objeto`);
    }
    for (const campo of requeridos) {
        const valor = evento[campo];
        const vacio = valor === undefined || valor === null || String(valor).trim() === '';
        if (vacio) {
            throw new Error(`Evento "${nombreEvento}" inválido: falta el campo "${campo}"`);
        }
    }
}

module.exports = { manejarRecuperacionCuenta, manejarCuentaStaff };
