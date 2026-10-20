async function enviarCorreo(destino, asunto, cuerpo) {
    const emailDestino = String(destino || '').trim();
    if (!emailDestino) throw new Error('destino de correo requerido');

    const faltantes = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter(nombre => !process.env[nombre]);
    if (faltantes.length) {
        throw new Error(`SMTP no configurado: falta(n) ${faltantes.join(', ')}. No se envió el correo.`);
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
    });

    const resultado = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: emailDestino,
        subject: asunto,
        text: cuerpo
    });
    return { enviado: true, simulado: false, destino: emailDestino, messageId: resultado.messageId };
}

// Se mantiene como utilidad para otros módulos; los handlers de este proyecto
// usan notificacionService.enviarConReintentos para registrar cada intento en BD.
async function enviarCorreoConReintentos(destino, asunto, cuerpo, maxReintentos = 3) {
    let ultimoError;
    for (let intento = 1; intento <= maxReintentos; intento++) {
        try {
            return { ...(await enviarCorreo(destino, asunto, cuerpo)), intentos: intento };
        } catch (error) {
            ultimoError = error;
        }
    }
    throw new Error(`Falló el envío después de ${maxReintentos} intentos: ${ultimoError.message}`);
}

module.exports = { enviarCorreo, enviarCorreoConReintentos };
