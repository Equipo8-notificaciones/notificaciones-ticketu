const assert = require('node:assert/strict');
const test = require('node:test');
const notificacionService = require('./notificacionService');

test('las operaciones de lectura y cambio solo permiten acceder al propietario', async () => {
    const propia = await notificacionService.crearNotificacion({
        usuarioId: 'usuario-propietario',
        tipo: 'COMPRA',
        canal: 'APP',
        mensaje: 'Notificación propia'
    });
    const ajena = await notificacionService.crearNotificacion({
        usuarioId: 'otro-usuario',
        tipo: 'COMPRA',
        canal: 'APP',
        mensaje: 'Notificación ajena'
    });

    assert.equal(
        (await notificacionService.obtenerNotificacionDeUsuario(
            propia.id_notificacion,
            'usuario-propietario'
        )).id_usuario,
        'usuario-propietario'
    );
    await assert.rejects(
        notificacionService.obtenerNotificacionDeUsuario(ajena.id_notificacion, 'usuario-propietario'),
        /Notificación no encontrada/
    );
    await assert.rejects(
        notificacionService.marcarComoLeida(ajena.id_notificacion, 'usuario-propietario'),
        /Notificación no encontrada/
    );
    await assert.rejects(
        notificacionService.eliminar(ajena.id_notificacion, 'usuario-propietario'),
        /Notificación no encontrada/
    );
    const resultadoEliminacion = await notificacionService.eliminarVarias(
        [propia.id_notificacion, ajena.id_notificacion],
        'usuario-propietario'
    );
    assert.deepEqual(resultadoEliminacion.map(n => n.id_notificacion), [propia.id_notificacion]);
});
