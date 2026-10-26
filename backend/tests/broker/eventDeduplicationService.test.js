const assert = require('node:assert/strict');
const test = require('node:test');
const { createEventDeduplicationService } = require('../../src/services/eventDeduplicationService');

test('deduplica payloads iguales sin requerir event_id', async () => {
    const deduplicador = createEventDeduplicationService(() => null);
    let ejecuciones = 0;
    const handler = async () => {
        ejecuciones++;
        return 'procesado';
    };

    const primera = await deduplicador.procesarUnaVez(
        'entradas.events', 'entradas_emitidas', { id_usuario: 'usr-1', id_evento: 'evt-1' }, handler
    );
    const segunda = await deduplicador.procesarUnaVez(
        'entradas.events', 'entradas_emitidas', { id_evento: 'evt-1', id_usuario: 'usr-1' }, handler
    );

    assert.deepEqual(primera, { duplicado: false, resultado: 'procesado' });
    assert.deepEqual(segunda, { duplicado: true });
    assert.equal(ejecuciones, 1);
});

test('payloads diferentes se procesan aunque compartan el mismo evento de negocio', async () => {
    const deduplicador = createEventDeduplicationService(() => null);
    let ejecuciones = 0;

    await deduplicador.procesarUnaVez(
        'panel.evento.notificaciones.v1',
        'evento_actualizado',
        { id_evento: 'evento-1', id_usuario: 'staff-1', nuevo_estado: 'cancelado' },
        async () => { ejecuciones++; }
    );
    await deduplicador.procesarUnaVez(
        'panel.evento.notificaciones.v1',
        'evento_actualizado',
        { id_evento: 'evento-1', id_usuario: 'staff-2', nuevo_estado: 'cancelado' },
        async () => { ejecuciones++; }
    );

    assert.equal(ejecuciones, 2);
});

test('permite reintentar el mismo payload si el handler falla', async () => {
    const deduplicador = createEventDeduplicationService(() => null);
    let ejecuciones = 0;

    await assert.rejects(
        deduplicador.procesarUnaVez(
            'auth.events',
            'recuperacion_cuenta',
            { id_usuario: 'usr-1', gmail_destino: 'user@example.com' },
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
        { gmail_destino: 'user@example.com', id_usuario: 'usr-1' },
        async () => {
            ejecuciones++;
            return 'recuperado';
        }
    );

    assert.equal(reintento.duplicado, false);
    assert.equal(ejecuciones, 2);
});
