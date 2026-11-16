const assert = require('node:assert/strict');
const {
    abrirCanal,
    esperarMensaje,
    publicar
} = require('./_rabbitmqTestUtils');

const EMAIL = 'g.herreraosorio@gmail.com';
const ID_USUARIO = `usuario-recuperacion-${Date.now()}`;

async function main() {
    const { connection, channel } = await abrirCanal();
    try {
        const confirmacion = esperarMensaje(channel, 'notificaciones.events', 'correo_auth');
        await publicar(channel, 'auth.events', 'recuperacion_cuenta', {
            id_usuario: ID_USUARIO,
            email_destino: EMAIL,
            url: 'https://ticketu.cl/restablecer?token=test-recuperacion'
        });
        const resultado = await confirmacion;
        assert.deepEqual(resultado, {
            email_destino: EMAIL,
            estado_envio: 'exitoso'
        });
        console.log(`OK: recuperacion_cuenta envió correo a ${EMAIL}.`);
        console.log(`Resultado RabbitMQ: ${JSON.stringify(resultado)}`);
    } finally {
        await channel.close().catch(() => {});
        await connection.close().catch(() => {});
    }
}

main().catch(error => {
    console.error(`FALLO en recuperacion_cuenta: ${error.message}`);
    process.exitCode = 1;
});
