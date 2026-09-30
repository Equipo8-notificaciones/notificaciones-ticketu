// Pruebas de las rutas REST con supertest
process.env.BROKER_MODE = 'mock';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const repository = require('../src/repositories/notificacionRepository');

// Limpia el repositorio en memoria antes de cada test
function limpiarRepositorio() {
  repository.notificaciones = [];
}

//  Rutas básicas
describe('Rutas REST: health y swagger', () => {

  test('GET /health responde 200 con estado OK', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.servicio, 'notificaciones');
    assert.strictEqual(res.body.estado, 'OK');
  });

  test('GET /api-docs sirve Swagger UI', async () => {
    const res = await request(app).get('/api-docs/');
    assert.strictEqual(res.status, 200);
  });
});

//  POST /api/notificaciones
describe('Rutas REST: POST /api/notificaciones', () => {
  beforeEach(limpiarRepositorio);

  test('crea una notificación válida (201)', async () => {
    const res = await request(app)
      .post('/api/notificaciones')
      .send({
        usuarioId: 'u1',
        tipo: 'COMPRA',
        titulo: 'Test',
        mensaje: 'Mensaje de prueba'
      });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id_notificacion);
  });

  test('sin datos retorna 400', async () => {
    const res = await request(app).post('/api/notificaciones').send({});
    assert.strictEqual(res.status, 400);
  });
});

//  GET /api/notificaciones
describe('Rutas REST: GET /api/notificaciones', () => {
  beforeEach(limpiarRepositorio);

  test('con usuarioId retorna 200 y array', async () => {
    await request(app).post('/api/notificaciones').send({
      usuarioId: 'u1', tipo: 'COMPRA', titulo: 'T', mensaje: 'M'
    });
    const res = await request(app).get('/api/notificaciones?usuarioId=u1');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.strictEqual(res.body.length, 1);
  });

  test('sin usuarioId retorna 400', async () => {
    const res = await request(app).get('/api/notificaciones');
    assert.strictEqual(res.status, 400);
  });

  test('con ID inexistente retorna 404', async () => {
    const res = await request(app).get('/api/notificaciones/NO-EXISTE');
    assert.strictEqual(res.status, 404);
  });
});

//  POST /api/notificaciones/:id/leida
describe('Rutas REST: POST /:id/leida', () => {
  beforeEach(limpiarRepositorio);

  test('marca la notificación como LEIDA', async () => {
    limpiarRepositorio();
    const creada = await request(app).post('/api/notificaciones').send({
      usuarioId: 'u1', tipo: 'COMPRA', titulo: 'T', mensaje: 'M'
    });
    const res = await request(app)
      .post(`/api/notificaciones/${creada.body.id_notificacion}/leida`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.estado, 'LEIDA');
  });
});

//  POST /api/notificaciones/marcar-todas-leidas
describe('Rutas REST: POST /marcar-todas-leidas', () => {
  beforeEach(limpiarRepositorio);

  test('marca todas las notificaciones como leídas', async () => {
    await request(app).post('/api/notificaciones').send({
      usuarioId: 'u1', tipo: 'COMPRA', titulo: 'T', mensaje: 'M'
    });
    const res = await request(app)
      .post('/api/notificaciones/marcar-todas-leidas')
      .send({ usuarioId: 'u1' });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });
});

// ─── DELETE /api/notificaciones/:id ──────────────────────────
describe('Rutas REST: DELETE /:id', () => {
  beforeEach(limpiarRepositorio);

  test('elimina lógicamente una notificación', async () => {
    const creada = await request(app).post('/api/notificaciones').send({
      usuarioId: 'u1', tipo: 'COMPRA', titulo: 'T', mensaje: 'M'
    });
    const res = await request(app)
      .delete(`/api/notificaciones/${creada.body.id_notificacion}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.estado, 'ELIMINADA');
  });
});

//  DELETE /api/notificaciones (varias)
describe('Rutas REST: DELETE (varias)', () => {
  beforeEach(limpiarRepositorio);

  test('elimina varias notificaciones con un array de ids', async () => {
    const c1 = await request(app).post('/api/notificaciones').send({
      usuarioId: 'u1', tipo: 'COMPRA', titulo: 'T1', mensaje: 'M1'
    });
    const c2 = await request(app).post('/api/notificaciones').send({
      usuarioId: 'u1', tipo: 'COMPRA', titulo: 'T2', mensaje: 'M2'
    });
    const res = await request(app)
      .delete('/api/notificaciones')
      .send({ ids: [c1.body.id_notificacion, c2.body.id_notificacion] });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 2);
  });
});
