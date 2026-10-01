const notificacionService = require('../services/notificacionService');
const emailService = require('../services/emailService');
const broker = require('../broker');

//Procesa los eventos publicados por Auth para generar y enviar notificaciones.
async function manejarRecuperacionCuenta(evento) {
    return procesarEventoAuth(evento, 'recuperacion_cuenta', 'Restablecer contraseña');
}

async function manejarCrearCuenta(evento) {
    return procesarEventoAuth(evento, 'crear_cuenta', 'Cuenta creada de Staff');
}

async function procesarEventoAuth(evento, tipoEsperado, tituloNotificacion) {
    validar(evento, tipoEsperado);

    const { id_usuario: usuarioId, email_destino: emailDestino, url } = evento;

    const notificacion = await notificacionService.crearNotificacion({
        usuarioId: String(usuarioId),
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

        await broker.publish('notificaciones.auth.resultado', {
            email_destino: emailDestino,
            estado_envio: 'exitoso'
        });
    } catch (error) {
        await broker.publish('notificaciones.auth.resultado', {
            email_destino: emailDestino,
            estado_envio: 'error',
            error_envio: error.message
        });
    }

    return notificacion;
}

function validar(evento, tipoEsperado) {
    if (!evento || evento.tipo !== tipoEsperado) {
        throw new Error(`Evento inválido: se esperaba tipo "${tipoEsperado}"`);
    }
    const requeridos = ['id_usuario', 'email_destino', 'url'];
    for (const campo of requeridos) {
        if (evento[campo] === undefined || evento[campo] === null) {
            throw new Error(`Evento "${tipoEsperado}" inválido: falta el campo "${campo}"`);
        }
    }
}

module.exports = { manejarRecuperacionCuenta, manejarCrearCuenta };