//Envía correos mediante una implementación simulada

async function enviarCorreo(destino, asunto, cuerpo) {
    if (!destino) {
        throw new Error('destino de correo requerido');
    }

    console.log(`[emailService MOCK] Enviando correo a ${destino} | asunto: "${asunto}"`);
    console.log(`[emailService MOCK] cuerpo: ${cuerpo}`);

    // Simula un envío exitoso.
    return { enviado: true, destino };
}

module.exports = { enviarCorreo };
