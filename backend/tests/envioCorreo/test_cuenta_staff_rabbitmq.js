const assert = require('node:assert/strict');
const {
    abrirCanal,
    esperarMensaje,
    publicar
} = require('./_rabbitmqTestUtils');

const EMAIL = 'g.herreraosorio@gmail.com';
const TOKEN_PRUEBA = `test-cuenta-staff-${Date.now()}`;

async function main() {
    const { connection, channel } = await abrirCanal();
    try {
        const confirmacion = esperarMensaje(channel, 'notificaciones.events', 'correo_auth');
        await publicar(channel, 'auth.events', 'cuenta_staff', {
            email_destino: EMAIL,
            url: `https://ticketu.cl/restablecer?token=${TOKEN_PRUEBA}`
        });
        const resultado = await confirmacion;
        assert.deepEqual(resultado, {
            email_destino: EMAIL,
            estado_envio: 'exitoso'
        });
        console.log(`OK: cuenta_staff envió correo a ${EMAIL}.`);
        console.log(`Resultado RabbitMQ: ${JSON.stringify(resultado)}`);
    } finally {
        await channel.close().catch(() => {});
        await connection.close().catch(() => {});
    }
}

main().catch(error => {
    console.error(`FALLO en cuenta_staff: ${error.message}`);
    process.exitCode = 1;
});
