/**
 * Canal APP simulado para desarrollo. Cada resultado (incluidos los reintentos)
 * se registra en envios_notificacion mediante notificacionService.
 */
async function enviarNotificacion(notificacion) {
    console.log(
        `[canalEnvioService MOCK] Entrega APP a usuario ${notificacion.id_usuario}: ${notificacion.tipo}`
    );
    return { enviado: true, simulado: true };
}

module.exports = { enviarNotificacion };
