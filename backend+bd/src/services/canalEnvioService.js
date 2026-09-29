//Envía una notificación mediante el canal simulado
async function enviarNotificacion(notificacion) {
    console.log(`[canalEnvioService MOCK] Notificando a usuario ${notificacion.usuario_id}: "${notificacion.titulo}"`);
    return { enviado: true };
}

module.exports = { enviarNotificacion };
