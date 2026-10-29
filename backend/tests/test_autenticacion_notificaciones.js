
const assert = require('node:assert/strict');

const BASE_URL =
    process.env.NOTIFICACIONES_URL || 'http://localhost:3000';

const COOKIE_A = process.env.TEST_COOKIE_USER_A;
const COOKIE_B = process.env.TEST_COOKIE_USER_B;

// IDs de notificaciones conocidas y exclusivas de cada cuenta.
// Debes configurarlos para comprobar el aislamiento entre usuarios.
const NOTIFICACION_A = process.env.TEST_NOTIFICACION_ID_A;
const NOTIFICACION_B = process.env.TEST_NOTIFICACION_ID_B;

async function requestNotificaciones(cookie, query = '') {
    const url = `${BASE_URL}/api/notificaciones${query}`;

    const headers = {};
    if (cookie) headers.Cookie = cookie;

    const response = await fetch(url, { headers });

    const text = await response.text();
    let body;

    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }

    return {
        status: response.status,
        body
    };
}

function contieneId(respuesta, id) {
    return JSON.stringify(respuesta).includes(id);
}

async function main() {
    console.log('\n=== TEST DE AUTENTICACIÓN Y NOTIFICACIONES ===\n');

    // 1. Sin cookie: debe rechazar la petición.
    const sinSesion = await requestNotificaciones(null);
    assert.equal(
        sinSesion.status,
        401,
        `Sin sesión debía responder 401; respondió ${sinSesion.status}`
    );
    console.log('✓ Sin sesión: HTTP 401');

    // 2. Cookie falsa: no debe autorizar el acceso.
    const sesionInvalida = await requestNotificaciones(
        'jwt_token=token_invalido_para_pruebas'
    );

    assert.ok(
        [401, 403].includes(sesionInvalida.status),
        `La sesión inválida respondió HTTP ${sesionInvalida.status}`
    );
    console.log(`✓ Sesión inválida: HTTP ${sesionInvalida.status}`);

    // Para continuar se necesitan sesiones reales de dos usuarios.
    assert.ok(
        COOKIE_A && COOKIE_B,
        'Configura TEST_COOKIE_USER_A y TEST_COOKIE_USER_B con cookies reales de Auth.'
    );

    // 3. Usuario A: sesión válida.
    const respuestaA = await requestNotificaciones(COOKIE_A);

    assert.equal(
        respuestaA.status,
        200,
        `Usuario A: se esperaba HTTP 200; se recibió ${respuestaA.status}. ` +
        JSON.stringify(respuestaA.body)
    );

    assert.ok(
        Array.isArray(respuestaA.body),
        'La respuesta de A debe ser una lista JSON.'
    );
    console.log(`✓ Usuario A autenticado: HTTP 200; notificaciones: ${respuestaA.body.length}`);

    // 4. Usuario B: sesión válida.
    const respuestaB = await requestNotificaciones(COOKIE_B);

    assert.equal(
        respuestaB.status,
        200,
        `Usuario B: se esperaba HTTP 200; se recibió ${respuestaB.status}. ` +
        JSON.stringify(respuestaB.body)
    );

    assert.ok(
        Array.isArray(respuestaB.body),
        'La respuesta de B debe ser una lista JSON.'
    );
    console.log(`✓ Usuario B autenticado: HTTP 200; notificaciones: ${respuestaB.body.length}`);

    // 5. Comprobación de aislamiento con notificaciones identificables.
    assert.ok(
        NOTIFICACION_A && NOTIFICACION_B,
        'Configura TEST_NOTIFICACION_ID_A y TEST_NOTIFICACION_ID_B con IDs reales.'
    );

    assert.ok(
        contieneId(respuestaA.body, NOTIFICACION_A),
        'No se encontró la notificación exclusiva de A en su respuesta.'
    );

    assert.ok(
        !contieneId(respuestaA.body, NOTIFICACION_B),
        'FALLO DE AISLAMIENTO: A recibió la notificación exclusiva de B.'
    );

    assert.ok(
        contieneId(respuestaB.body, NOTIFICACION_B),
        'No se encontró la notificación exclusiva de B en su respuesta.'
    );

    assert.ok(
        !contieneId(respuestaB.body, NOTIFICACION_A),
        'FALLO DE AISLAMIENTO: B recibió la notificación exclusiva de A.'
    );

    console.log('✓ Cada usuario ve su notificación exclusiva.');
    console.log('✓ Ningún usuario recibió la notificación exclusiva del otro.');

    // 6. Manipular el parámetro usuarioId no debe cambiar la identidad.
    const respuestaAModificada = await requestNotificaciones(
        COOKIE_A,
        '?usuarioId=usuario_de_otro'
    );

    assert.equal(
        respuestaAModificada.status,
        200,
        'La consulta de A con usuarioId manipulado no respondió HTTP 200.'
    );

    assert.deepEqual(
        respuestaAModificada.body,
        respuestaA.body,
        'La respuesta cambió al manipular usuarioId; revisa cómo se identifica al usuario.'
    );

    console.log('✓ Modificar usuarioId en la URL no cambia las notificaciones de A.');
    console.log('\nRESULTADO: todas las comprobaciones pasaron.\n');
}

main().catch(error => {
    console.error('\n✗ TEST FALLIDO:', error.message);
    process.exitCode = 1;
});
