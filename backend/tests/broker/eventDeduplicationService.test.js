const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const test = require('node:test');
const { createEventDeduplicationService } = require('../../src/services/eventDeduplicationService');

test('procesa una sola vez el mismo event_id en el mismo exchange y routing key', async () => {
    const deduplicador = createEventDeduplicationService(() => null);
    const eventId = randomUUID();
    let ejecuciones = 0;
    const handler = async () => {
        ejecuciones++;
        return 'procesado';
    };

    const primera = await deduplicador.procesarUnaVez(
        'entradas.events', 'entradas_emitidas', { event_id: eventId }, handler
    );
    const segunda = await deduplicador.procesarUnaVez(
        'entradas.events', 'entradas_emitidas', { event_id: eventId }, handler
    );

    assert.deepEqual(primera, { duplicado: false, resultado: 'procesado' });
    assert.deepEqual(segunda, { duplicado: true });
    assert.equal(ejecuciones, 1);
});

test('eventos con event_id distintos se procesan aunque pertenezcan al mismo evento de negocio', async () => {
    const deduplicador = createEventDeduplicationService(() => null);
    let ejecuciones = 0;

    await deduplicador.procesarUnaVez(
        'panel.evento.notificaciones.v1',
        'evento_actualizado',
        { event_id: randomUUID(), id_evento: 'evento-1' },
        async () => { ejecuciones++; }
    );
    await deduplicador.procesarUnaVez(
        'panel.evento.notificaciones.v1',
        'evento_actualizado',
        { event_id: randomUUID(), id_evento: 'evento-1' },
        async () => { ejecuciones++; }
    );

    assert.equal(ejecuciones, 2);
});

test('requiere event_id y permite reintentar si el handler falla', async () => {
    const deduplicador = createEventDeduplicationService(() => null);
    const eventId = randomUUID();
    let ejecuciones = 0;

    await assert.rejects(
        deduplicador.procesarUnaVez('auth.events', 'recuperacion_cuenta', {}, async () => {}),
        /event_id único/
    );
    await assert.rejects(
        deduplicador.procesarUnaVez(
            'auth.events',
            'recuperacion_cuenta',
            { event_id: eventId },
            async () => {
                ejecuciones++;
                throw new Error('fallo temporal');
            }
        ),
        /fallo temporal/
    );

    const reintento = await deduplicador.procesarUnaVez(
        'auth.events',
        'recuperacion_cuenta',
        { event_id: eventId },
        async () => {
            ejecuciones++;
            return 'recuperado';
        }
    );

    assert.equal(reintento.duplicado, false);
    assert.equal(ejecuciones, 2);
});
