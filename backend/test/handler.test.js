// Pruebas del handler de eventos de entrada emitida
process.env.BROKER_MODE = 'mock';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const broker = require('../src/broker/mockBroker');
const repository = require('../src/repositories/notificacionRepository');

// Mock global de crearTrabajoRecordatorio ANTES de importar el handler
const llamadasRecordatorio = [];
const jobsPath = path.resolve(__dirname, '../src/jobs/notificacionJobs.js');
const jobsReales = require(jobsPath);

require.cache[require.resolve(jobsPath)] = {
  id: jobsPath,
  filename: jobsPath,
  loaded: true,
  exports: {
    ...jobsReales,
    crearTrabajoRecordatorio: (datos) => {
      llamadasRecordatorio.push(datos);
      return { tipo: 'RECORDATORIO_24H', datos };
    }
  }
};

const {
  manejarEntradaEmitida,
  procesarEnvioCorreoEntradaEmitida,
  TOPICO_INTERNO_ENVIO_CORREO
} = require('../src/events/entradaEmitidaHandler');

// Limpia el repositorio en memoria antes de cada test
function limpiarRepositorio() {
  repository.notificaciones = [];
}

//  manejarEntradaEmitida 
describe('Handler: manejarEntradaEmitida', () => {
  beforeEach(limpiarRepositorio);

  test('procesa un evento válido y crea una notificación', async () => {
    const evento = {
      tipo: 'entrada_emitida',
      id_usuario: 'u1',
      id_evento: 'ev1',
      nombre_evento: 'Concierto',
      fecha_evento: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      cantidad_entradas: 2,
      fecha_emision: new Date().toISOString()
    };

    const notificacion = await manejarEntradaEmitida(evento);
    assert.ok(notificacion.id_notificacion);
    assert.strictEqual(notificacion.usuario_id, 'u1');
    assert.match(notificacion.titulo, /2 entrada/);
  });

  test('rechaza un evento con tipo incorrecto', async () => {
    await assert.rejects(
      () => manejarEntradaEmitida({ tipo: 'otro_evento' }),
      /Evento inválido/
    );
  });

  test('rechaza un evento sin campos requeridos', async () => {
    await assert.rejects(
      () => manejarEntradaEmitida({ tipo: 'entrada_emitida' }),
      /falta el campo/
    );
  });

  test('publica al tópico interno de envío de correo', async () => {
    const publicados = [];
    const originalPublish = broker.publish.bind(broker);
    broker.publish = async (topic, payload) => {
      publicados.push({ topic, payload });
      return originalPublish(topic, payload);
    };

    const evento = {
      tipo: 'entrada_emitida',
      id_usuario: 'u1',
      id_evento: 'ev1',
      nombre_evento: 'Concierto',
      fecha_evento: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      cantidad_entradas: 1
    };

    await manejarEntradaEmitida(evento);
    assert.ok(publicados.some((p) => p.topic === TOPICO_INTERNO_ENVIO_CORREO));
    broker.publish = originalPublish;
  });
});

//  procesarEnvioCorreoEntradaEmitida
describe('Handler: procesarEnvioCorreoEntradaEmitida', () => {
  beforeEach(limpiarRepositorio);

  test('ignora un mensaje sin id_notificacion sin lanzar error', async () => {
    await assert.doesNotReject(() => procesarEnvioCorreoEntradaEmitida({}));
  });

  test('procesa un mensaje con id_notificacion existente', async () => {
    const service = require('../src/services/notificacionService');
    const { TiposNotificacion } = require('../src/models/Notificacion');
    const n = await service.crearNotificacion({
      usuarioId: 'u1',
      tipo: TiposNotificacion.COMPRA,
      titulo: 'T',
      mensaje: 'M'
    });
    await assert.doesNotReject(() =>
      procesarEnvioCorreoEntradaEmitida({ id_notificacion: n.id_notificacion })
    );
  });
});

//  Encolado del correo
describe('Handler: encolado del correo', () => {
  beforeEach(limpiarRepositorio);

  test('encola el correo exactamente una vez por evento', async () => {
    const publicados = [];
    const originalPublish = broker.publish.bind(broker);
    broker.publish = async (topic, payload) => {
      publicados.push({ topic, payload});
      return originalPublish(topic, payload);
    };

    const evento = {
      tipo: 'entrada_emitida',
      id_usuario: 'u1',
      id_evento: 'ev1',
      nombre_evento: 'Concierto',
      fecha_evento: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      cantidad_entradas: 2
    };
    
    await manejarEntradaEmitida(evento);

    const encolados = publicados.filter((p) => p.topic === TOPICO_INTERNO_ENVIO_CORREO);
    assert.strictEqual(encolados.length, 1);
    assert.ok(encolados[0].payload.id_notificacion);

    broker.publish = originalPublish;
  });
});

//  Temporización del recordatorio
describe('Handler: temporización del recordatorio', () => {
  beforeEach(() => {
    llamadasRecordatorio.length = 0;
    limpiarRepositorio();
  });

  test('programa con momento 24H_ANTES si el evento es en más de 24 horas', async () => {
    const evento = {
      tipo: 'entrada_emitida',
      id_usuario: 'u1',
      id_evento: 'ev1',
      nombre_evento: 'Concierto',
      fecha_evento: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      cantidad_entradas: 2
    };

    await manejarEntradaEmitida(evento);

    assert.strictEqual(llamadasRecordatorio.length, 1);
    assert.strictEqual(llamadasRecordatorio[0].momento, '24H_ANTES');
    assert.strictEqual(llamadasRecordatorio[0].usuarioId, 'u1');
    assert.strictEqual(llamadasRecordatorio[0].idEvento, 'ev1');
  });

  test('programa con momento INMEDIATO si el evento es en menos de 24 horas', async () => {
    const evento = {
      tipo: 'entrada_emitida',
      id_usuario: 'u1',
      id_evento: 'ev1',
      nombre_evento: 'Concierto',
      fecha_evento: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      cantidad_entradas: 1
    };

    await manejarEntradaEmitida(evento);

    assert.strictEqual(llamadasRecordatorio.length, 1);
    assert.strictEqual(llamadasRecordatorio[0].momento, 'INMEDIATO');
  });

  test('programa con momento INMEDIATO si el evento ya ocurrió', async () => {
    const evento = {
      tipo: 'entrada_emitida',
      id_usuario: 'u1',
      id_evento: 'ev1',
      nombre_evento: 'Concierto',
      fecha_evento: new Date(Date.now() - 3600 * 1000).toISOString(),
      cantidad_entradas: 1
    };

    await manejarEntradaEmitida(evento);

    assert.strictEqual(llamadasRecordatorio.length, 1);
    assert.strictEqual(llamadasRecordatorio[0].momento, 'INMEDIATO');
  });
});



