// Pruebas del NotificacionService (broker mock, repositorio en memoria)
process.env.BROKER_MODE = 'mock';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

const service = require('../src/services/notificacionService');
const repository = require('../src/repositories/notificacionRepository');
const { EstadosNotificacion, TiposNotificacion } = require('../src/models/Notificacion');

// Limpia el repositorio en memoria antes de cada test
function limpiarRepositorio() {
  repository.notificaciones = [];
}

// Payload base reutilizable para construir notificaciones válidas
function payloadBase(overrides = {}) {
  return {
    usuarioId: 'u-test',
    tipo: TiposNotificacion.COMPRA,
    titulo: 'Título de prueba',
    mensaje: 'Mensaje de prueba',
    ...overrides
  };
}

// ─── crearNotificacion ───────────────────────────────────────
describe('NotificacionService.crearNotificacion', () => {
  beforeEach(limpiarRepositorio);

  test('persiste una notificación válida con estado inicial NO_LEIDA y fecha de emisión', async () => {
    const notificacion = await service.crearNotificacion(payloadBase());

    assert.ok(notificacion.id_notificacion, 'Debe generarse un identificador');
    assert.match(notificacion.id_notificacion, /^NOT-\d+-\d+$/);
    assert.strictEqual(notificacion.usuario_id, 'u-test');
    assert.strictEqual(notificacion.tipo, TiposNotificacion.COMPRA);
    assert.strictEqual(notificacion.estado, EstadosNotificacion.NO_LEIDA);
    assert.strictEqual(notificacion.intentos_envio, 0);
    assert.strictEqual(notificacion.error_envio, null);
    assert.ok(notificacion.fecha_emision, 'Debe registrar la fecha de emisión');
  });

  test('rechaza la creación cuando falta usuarioId, tipo, titulo o mensaje', async () => {
    const casosInvalidos = [
      { ...payloadBase(), usuarioId: undefined },
      { ...payloadBase(), tipo: undefined },
      { ...payloadBase(), titulo: undefined },
      { ...payloadBase(), mensaje: undefined }
    ];

    for (const payload of casosInvalidos) {
      await assert.rejects(
        () => service.crearNotificacion(payload),
        /obligatorios/,
        `Debe rechazar payload: ${JSON.stringify(payload)}`
      );
    }
  });

  test('rechaza un tipo de notificación que no está en TiposNotificacion', async () => {
    await assert.rejects(
      () => service.crearNotificacion(payloadBase({ tipo: 'TIPO_INVENTADO' })),
      /Tipo de notificación inválido/
    );
  });
});

// ─── Consultas ───────────────────────────────────────────────
describe('NotificacionService: consultas', () => {
  beforeEach(limpiarRepositorio);

  test('obtenerCentro devuelve solo las notificaciones del usuario solicitado', async () => {
    await service.crearNotificacion(payloadBase({ usuarioId: 'u-1' }));
    await service.crearNotificacion(payloadBase({ usuarioId: 'u-1' }));
    await service.crearNotificacion(payloadBase({ usuarioId: 'u-2' }));

    const centro = await service.obtenerCentro('u-1');
    assert.strictEqual(centro.length, 2);
    assert.ok(centro.every((n) => n.usuario_id === 'u-1'));
  });

  test('obtenerCentro falla si no se entrega usuarioId', async () => {
    await assert.rejects(() => service.obtenerCentro(), /usuarioId es obligatorio/);
  });

  test('obtenerPorId retorna la notificación previamente creada', async () => {
    const creada = await service.crearNotificacion(payloadBase());
    const encontrada = await service.obtenerPorId(creada.id_notificacion);
    assert.strictEqual(encontrada.id_notificacion, creada.id_notificacion);
    assert.strictEqual(encontrada.titulo, 'Título de prueba');
  });

  test('obtenerPorId lanza error cuando el ID no existe', async () => {
    await assert.rejects(
      () => service.obtenerPorId('NOT-INEXISTENTE'),
      /Notificación no encontrada/
    );
  });
});

// ─── Transiciones de estado ──────────────────────────────────
describe('NotificacionService: transiciones de estado', () => {
  beforeEach(limpiarRepositorio);

  test('marcarComoLeida cambia el estado a LEIDA y registra fecha_lectura', async () => {
    const creada = await service.crearNotificacion(payloadBase());
    const actualizada = await service.marcarComoLeida(creada.id_notificacion);

    assert.strictEqual(actualizada.estado, EstadosNotificacion.LEIDA);
    assert.ok(actualizada.fecha_lectura, 'Debe registrarse la fecha de lectura');
  });

  test('marcarTodasComoLeidas actualiza únicamente las que están NO_LEIDA', async () => {
    const a = await service.crearNotificacion(payloadBase({ usuarioId: 'u-1' }));
    const b = await service.crearNotificacion(payloadBase({ usuarioId: 'u-1' }));
    await service.marcarComoLeida(a.id_notificacion);

    const actualizadas = await service.marcarTodasComoLeidas('u-1');

    assert.strictEqual(actualizadas.length, 1);
    assert.strictEqual(actualizadas[0].id_notificacion, b.id_notificacion);
    assert.strictEqual(actualizadas[0].estado, EstadosNotificacion.LEIDA);
  });

  test('eliminar marca la notificación como ELIMINADA sin borrarla físicamente', async () => {
    const creada = await service.crearNotificacion(payloadBase());
    const eliminada = await service.eliminar(creada.id_notificacion);

    assert.strictEqual(eliminada.estado, EstadosNotificacion.ELIMINADA);
    assert.ok(eliminada.fecha_eliminacion, 'Debe registrarse la fecha de eliminación');

    const sigueExistiendo = await service.obtenerPorId(creada.id_notificacion);
    assert.strictEqual(sigueExistiendo.estado, EstadosNotificacion.ELIMINADA);
  });

  test('eliminarVarias rechaza arreglos vacíos o no arreglos', async () => {
    await assert.rejects(() => service.eliminarVarias([]), /al menos un ID/);
    await assert.rejects(() => service.eliminarVarias(null), /al menos un ID/);
    await assert.rejects(() => service.eliminarVarias('NO-ES-ARRAY'), /al menos un ID/);
  });
});

// ─── Reintentos de envío ─────────────────────────────────────
describe('NotificacionService.enviarConReintentos', () => {
  beforeEach(limpiarRepositorio);

  test('al primer intento exitoso registra intentos_envio=1 y limpia error_envio', async () => {
    const creada = await service.crearNotificacion(payloadBase());
    let llamadas = 0;

    const resultado = await service.enviarConReintentos(
      creada.id_notificacion,
      async () => { llamadas += 1; }
    );

    assert.strictEqual(llamadas, 1);
    assert.strictEqual(resultado.intentos_envio, 1);
    assert.strictEqual(resultado.error_envio, null);
  });

  test('tras 3 fallos consecutivos lanza error y registra el último mensaje', async () => {
    const creada = await service.crearNotificacion(payloadBase());
    let llamadas = 0;

    await assert.rejects(
      () => service.enviarConReintentos(
        creada.id_notificacion,
        async () => { llamadas += 1; throw new Error('SMTP no disponible'); },
        3
      ),
      /Falló el envío después de 3 intentos/
    );

    assert.strictEqual(llamadas, 3, 'Debe intentar exactamente maxReintentos veces');
  });
});

