require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../../.env') });

const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { Pool } = require('pg');

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:10000';
const NOTIFICACIONES_URL = process.env.NOTIFICACIONES_URL || 'http://localhost:3001';
const DATABASE_URL = process.env.DATABASE_URL;
const TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS || 30000);

async function request(url, options = {}) {
    return fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

async function verificarEstado(response, esperado, label) {
    if (response.status !== esperado) {
        throw new Error(`${label}: HTTP ${response.status}: ${await response.text()}`);
    }
}

async function json(response, label) {
    const body = await response.text();
    let parsed;
    try { parsed = body ? JSON.parse(body) : null; }
    catch { throw new Error(`${label}: respuesta JSON inválida: ${body}`); }
    return parsed;
}

function obtenerCookie(response) {
    const cookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [response.headers.get('set-cookie')].filter(Boolean);
    const cookie = cookies.find(value => /^jwt=/.test(value));
    assert.ok(cookie, 'Auth no devolvió la cookie jwt.');
    return cookie.split(';', 1)[0];
}

async function registrarEIniciarSesion(etiqueta) {
    const unique = randomUUID();
    const usuario = {
        email: `notificaciones-${etiqueta}-${unique}@example.com`,
        password: `T3st-${randomBytes(18).toString('base64url')}!`,
        nombre: `Test Notificaciones ${etiqueta} ${unique}`,
        rut: crearRutValido()
    };
    const registration = await request(new URL('/api/auth/register', AUTH_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
    });
    await verificarEstado(registration, 201, `Auth no registró el usuario ${etiqueta}`);

    const login = await request(new URL('/api/auth/login', AUTH_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuario.email, password: usuario.password })
    });
    await verificarEstado(login, 200, `Login falló para ${etiqueta}`);
    return obtenerCookie(login);
}

function crearRutValido() {
    const body = String(10000000 + (randomBytes(4).readUInt32BE(0) % 80000000));
    let factor = 2;
    let sum = 0;
    for (let index = body.length - 1; index >= 0; index--) {
        sum += Number(body[index]) * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }
    const result = 11 - (sum % 11);
    const digit = result === 11 ? '0' : result === 10 ? 'K' : String(result);
    return `${body}-${digit}`;
}

async function main() {
    assert.ok(DATABASE_URL, 'Falta DATABASE_URL; el test de autenticación requiere Supabase.');
    console.log('1. Comprobando Auth, Notificaciones y Supabase...');
    const [authHealth, notiReady] = await Promise.all([
        request(new URL('/api/health', AUTH_URL)),
        request(new URL('/ready', NOTIFICACIONES_URL))
    ]);
    await verificarEstado(authHealth, 200, 'Auth no está disponible');
    await verificarEstado(notiReady, 200, 'Notificaciones/Supabase no está listo');

    console.log('2. Comprobando rechazo de sesión ausente e inválida...');
    const noSession = await request(new URL('/api/notificaciones', NOTIFICACIONES_URL));
    assert.equal(noSession.status, 401, 'Notificaciones debe rechazar solicitudes sin cookie.');
    const invalidSession = await request(new URL('/api/notificaciones', NOTIFICACIONES_URL), {
        headers: { Cookie: 'jwt=token_invalido_para_pruebas' }
    });
    assert.ok([401, 403].includes(invalidSession.status),
        `Auth debió rechazar la cookie inválida; HTTP ${invalidSession.status}.`);

    console.log('3. Registrando dos usuarios e iniciando sesión mediante Auth...');
    const [cookieA, cookieB] = await Promise.all([
        registrarEIniciarSesion('A'),
        registrarEIniciarSesion('B')
    ]);

    const [validacionA, validacionB] = await Promise.all([
        request(new URL('/api/auth/validar-sesion', AUTH_URL), { headers: { Cookie: cookieA } }),
        request(new URL('/api/auth/validar-sesion', AUTH_URL), { headers: { Cookie: cookieB } })
    ]);
    await verificarEstado(validacionA, 200, 'Auth rechazó la sesión A');
    await verificarEstado(validacionB, 200, 'Auth rechazó la sesión B');
    const [perfilA, perfilB] = await Promise.all([
        json(validacionA, 'Auth validar-sesion A'),
        json(validacionB, 'Auth validar-sesion B')
    ]);
    assert.equal(perfilA?.valido, true);
    assert.equal(perfilB?.valido, true);
    const idUsuarioA = perfilA?.usuario?.id_usuario;
    const idUsuarioB = perfilB?.usuario?.id_usuario;
    assert.ok(idUsuarioA && idUsuarioB && idUsuarioA !== idUsuarioB,
        'Auth debe entregar dos identificadores de usuario distintos.');

    console.log('4. Insertando notificaciones identificables en Supabase para probar aislamiento...');
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || /supabase/i.test(DATABASE_URL)
            ? { rejectUnauthorized: false } : undefined
    });
    const unique = randomUUID();
    const eventoA = `evt-auth-a-${unique}`;
    const eventoB = `evt-auth-b-${unique}`;
    try {
        await pool.query(
            `INSERT INTO public.notificacion (id_usuario, tipo, mensaje, datos, canal)
             VALUES
                ($1, 'COMPRA', 'Notificación privada A', $3::jsonb, 'APP'),
                ($2, 'COMPRA', 'Notificación privada B', $4::jsonb, 'APP')`,
            [idUsuarioA, idUsuarioB,
                JSON.stringify({ id_evento: eventoA }),
                JSON.stringify({ id_evento: eventoB })]
        );

        console.log('5. Comprobando que cada sesión ve solo sus propias notificaciones...');
        const [respuestaA, respuestaB] = await Promise.all([
            request(new URL('/api/notificaciones', NOTIFICACIONES_URL), { headers: { Cookie: cookieA } }),
            request(new URL('/api/notificaciones', NOTIFICACIONES_URL), { headers: { Cookie: cookieB } })
        ]);
        await verificarEstado(respuestaA, 200, 'Notificaciones rechazó la sesión A');
        await verificarEstado(respuestaB, 200, 'Notificaciones rechazó la sesión B');
        const [listaA, listaB] = await Promise.all([
            json(respuestaA, 'Centro de Notificaciones A'),
            json(respuestaB, 'Centro de Notificaciones B')
        ]);
        assert.ok(Array.isArray(listaA) && Array.isArray(listaB));
        assert.ok(listaA.some(n => n.datos?.id_evento === eventoA), 'A no recibió su notificación.');
        assert.ok(!listaA.some(n => n.datos?.id_evento === eventoB), 'FALLO: A recibió la notificación privada de B.');
        assert.ok(listaB.some(n => n.datos?.id_evento === eventoB), 'B no recibió su notificación.');
        assert.ok(!listaB.some(n => n.datos?.id_evento === eventoA), 'FALLO: B recibió la notificación privada de A.');

        const manipulada = await request(
            new URL(`/api/notificaciones?usuarioId=${encodeURIComponent(idUsuarioB)}`, NOTIFICACIONES_URL),
            { headers: { Cookie: cookieA } }
        );
        await verificarEstado(manipulada, 200, 'La consulta con usuarioId manipulado falló');
        const listaManipulada = await json(manipulada, 'Centro con usuarioId manipulado');
        assert.deepEqual(listaManipulada, listaA,
            'Cambiar usuarioId en la URL no debe alterar la identidad autenticada.');
    } finally {
        try {
            await pool.query(
                `DELETE FROM public.notificacion WHERE datos->>'id_evento' = ANY($1::text[])`,
                [[eventoA, eventoB]]
            );
        } finally {
            await pool.end();
        }
    }

    console.log('OK: Auth validó ambas cookies jwt.');
    console.log('OK: Notificaciones rechazó sesiones ausentes e inválidas.');
    console.log('OK: cada usuario consultó únicamente sus notificaciones en Supabase.');
    console.log('OK: modificar usuarioId en la URL no permitió suplantar a otro usuario.');
}

main().catch(error => {
    console.error('FALLO en integración Auth:', error.message);
    process.exitCode = 1;
});
