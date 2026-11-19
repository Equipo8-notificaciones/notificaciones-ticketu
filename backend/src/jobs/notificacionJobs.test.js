const assert = require('node:assert/strict');
const test = require('node:test');
const { planificarRecordatorio, formatearFechaEvento } = require('./notificacionJobs');

const horasEnMilisegundos = 60 * 60 * 1000;

test('programa el recordatorio exactamente 24 horas antes del evento', () => {
    const evento = new Date(2026, 9, 1, 18, 0, 0);
    const ahora = new Date(2026, 8, 30, 17, 0, 0);
    const plan = planificarRecordatorio('2026-10-01', '18:00', ahora);

    assert.equal(plan.fechaEnvio.getTime(), evento.getTime() - 24 * horasEnMilisegundos);
    assert.equal(plan.enviarAhora, false);
});

test('envía inmediatamente cuando quedan menos de 24 horas', () => {
    const ahora = new Date(2026, 8, 30, 19, 0, 0);
    const plan = planificarRecordatorio('2026-10-01', '18:00', ahora);

    assert.equal(plan.enviarAhora, true);
});

test('también envía inmediatamente justo cuando llega la hora programada', () => {
    const ahora = new Date(2026, 8, 30, 18, 0, 0);
    const plan = planificarRecordatorio('2026-10-01', '18:00', ahora);

    assert.equal(plan.enviarAhora, true);
});

test('formatea la fecha del evento como día-mes-año', () => {
    assert.equal(formatearFechaEvento('2026-10-01'), '01-10-2026');
    assert.equal(formatearFechaEvento('01-10-2026'), '01-10-2026');
});
