const SMTP_HOST = process.env.SMTP_HOST;

async function enviarCorreo(destino, asunto, cuerpo) {
    if (!destino) {
        throw new Error('destino de correo requerido');
    }

    if (SMTP_HOST) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER && process.env.SMTP_PASS
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined
        });
        const resultado = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: destino,
            subject: asunto,
            text: cuerpo
        });
        return { enviado: true, simulado: false, destino, messageId: resultado.messageId };
    }

    console.log(`[emailService MOCK] Correo no enviado a ${destino}; configura SMTP_HOST para envío real.`);
    console.log(`[emailService MOCK] asunto: "${asunto}" | cuerpo: ${cuerpo}`);
    return { enviado: false, simulado: true, destino };
}

async function enviarCorreoConReintentos(destino, asunto, cuerpo, maxReintentos = 3) {
    let ultimoError;

    for (let intento = 1; intento <= maxReintentos; intento++) {
        try {
            const resultado = await enviarCorreo(destino, asunto, cuerpo);
            return { ...resultado, intentos: intento };
        } catch (error) {
            ultimoError = error;
        }
    }

    throw new Error(`Falló el envío después de ${maxReintentos} intentos: ${ultimoError.message}`);
}

module.exports = { enviarCorreo, enviarCorreoConReintentos };