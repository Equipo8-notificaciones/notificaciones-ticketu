const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const http = require('node:http');
const { after, before, test } = require('node:test');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:10000';
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_URL || 'http://localhost:3001';
let testGateway;

function crearGatewayLocal() {
    const gateway = new URL(GATEWAY_URL);
    if (
        !['localhost', '127.0.0.1', '::1'].includes(gateway.hostname.replace(/^\[|\]$/g, '')) ||
        gateway.protocol !== 'http:'
    ) {
        throw new Error(
            `No hay un Gateway disponible en ${GATEWAY_URL}. Configura un Gateway real o usa una URL HTTP local para habilitar el puente de prueba.`
        );
    }

    const destinations = [
        { prefix: '/api/auth', url: new URL(AUTH_URL) },
        { prefix: '/api/notificaciones', url: new URL(NOTIFICATIONS_URL) }
    ];

    const server = http.createServer((request, response) => {
        const destination = destinations.find(({ prefix }) =>
            request.url === prefix || request.url.startsWith(`${prefix}/`)
        );
        if (!destination) {
            response.writeHead(404);
            response.end('Ruta fuera del alcance del Gateway local de prueba.');
            return;
        }

        const upstream = http.request({
            hostname: destination.url.hostname.replace(/^\[|\]$/g, ''),
            port: Number(destination.url.port || 80),
            path: request.url,
            method: request.method,
            headers: {
                ...request.headers,
                host: destination.url.host
            }
        }, upstreamResponse => {
            response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
            upstreamResponse.pipe(response);
        });

        upstream.setTimeout(30000, () => {
            upstream.destroy(new Error(`Tiempo de espera agotado para ${destination.url.origin}.`));
        });
        upstream.on('error', error => {
            if (response.headersSent) {
                response.destroy(error);
                return;
            }
            response.writeHead(502, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                error: 'UPSTREAM_UNAVAILABLE',
                message: `No se pudo conectar con ${destination.url.origin}: ${error.message}`
            }));
        });
        request.pipe(upstream);
    });

    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(Number(gateway.port || 80), '127.0.0.1', () => {
            server.removeListener('error', reject);
            resolve(server);
        });
    });
}

before(async () => {
    try {
        await fetch(`${GATEWAY_URL}/api/auth/validar-sesion`, {
            signal: AbortSignal.timeout(2000)
        });
    } catch (error) {
        if (!['ECONNREFUSED', 'ECONNRESET'].includes(error.cause?.code)) {
            throw new Error(`No fue posible comprobar el Gateway en ${GATEWAY_URL}: ${error.message}`, { cause: error });
        }
        testGateway = await crearGatewayLocal();
        console.log(
            `Gateway real no detectado; usando puente HTTP local de prueba en ${GATEWAY_URL}.`
        );
    }
});

after(async () => {
    if (!testGateway) return;
    await new Promise((resolve, reject) => {
        testGateway.close(error => error ? reject(error) : resolve());
    });
});

async function leerRespuesta(response, contexto) {
    const body = await response.text();
    if (!response.ok) {
        throw new Error(`${contexto}: HTTP ${response.status}: ${body}`);
    }

    try {
        return body ? JSON.parse(body) : null;
    } catch (error) {
        throw new Error(`${contexto}: respuesta JSON inválida.`, { cause: error });
    }
}

function obtenerCookieSesion(response) {
    const cookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [response.headers.get('set-cookie')].filter(Boolean);
    const cookie = cookies.find(value => /^jwt_token=/.test(value));
    assert.ok(cookie, 'Auth no devolvió la cookie jwt_token.');
    return cookie.split(';', 1)[0];
}

test('front y Notificaciones comparten la sesión real de Auth a través del Gateway', async () => {
    const uniqueId = randomUUID();
    const user = {
        email: `front-integration-${uniqueId}@example.com`,
        password: `Test-${randomUUID()}Aa9!`,
        nombre: `Front Integration ${uniqueId}`,
        rut: `DEV-${uniqueId.replaceAll('-', '').slice(0, 12)}`
    };
    const jsonHeaders = { 'Content-Type': 'application/json' };
    let cookie;
    let notificationId;

    try {
        const registration = await fetch(`${GATEWAY_URL}/api/auth/register`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(user),
            signal: AbortSignal.timeout(30000)
        });
        await leerRespuesta(registration, 'Registro de usuario de prueba');
        assert.equal(registration.status, 201);

        const login = await fetch(`${GATEWAY_URL}/api/auth/login`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ email: user.email, password: user.password }),
            signal: AbortSignal.timeout(30000)
        });
        await leerRespuesta(login, 'Inicio de sesión');
        assert.equal(login.status, 200);
        cookie = obtenerCookieSesion(login);

        const createdResponse = await fetch(`${GATEWAY_URL}/api/notificaciones`, {
            method: 'POST',
            headers: { ...jsonHeaders, Cookie: cookie },
            body: JSON.stringify({
                tipo: 'RECORDATORIO_24H',
                mensaje: 'Notificación creada por la prueba de integración front-back.',
                canal: 'APP',
                datos: {
                    id_evento: 'front-integration-event',
                    nombre_evento: 'Evento de integración front-back',
                    fecha_evento: '2026-12-01',
                    hora_evento: '19:30'
                }
            }),
            signal: AbortSignal.timeout(30000)
        });
        const created = await leerRespuesta(createdResponse, 'Creación de notificación');
        assert.equal(createdResponse.status, 201);
        notificationId = created.id_notificacion;

        const centerResponse = await fetch(`${GATEWAY_URL}/api/notificaciones/eventos`, {
            headers: { Cookie: cookie },
            signal: AbortSignal.timeout(30000)
        });
        const center = await leerRespuesta(centerResponse, 'Consulta del centro');
        assert.ok(center.some(notification =>
            String(notification.id_notificacion) === String(notificationId) &&
            notification.estado_lectura === 'NO_LEIDA'
        ), 'El centro no devolvió la notificación de prueba como no leída.');

        const pageResponse = await fetch(`${FRONTEND_URL}/notificaciones`, {
            signal: AbortSignal.timeout(30000)
        });
        assert.equal(pageResponse.status, 200, 'La página de Notificaciones del front no respondió HTTP 200.');
        const html = await pageResponse.text();
        const scriptPaths = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
            .map(match => match[1]);
        let clientUsesNotificationsApi = false;

        for (const scriptPath of scriptPaths) {
            const scriptResponse = await fetch(new URL(scriptPath, FRONTEND_URL), {
                signal: AbortSignal.timeout(30000)
            });
            if (!scriptResponse.ok) continue;

            const script = await scriptResponse.text();
            if (
                script.includes('/api/notificaciones/eventos') &&
                script.includes(GATEWAY_URL)
            ) {
                clientUsesNotificationsApi = true;
                break;
            }
        }

        assert.ok(
            clientUsesNotificationsApi,
            'El bundle del front no contiene la llamada configurada al API del centro de notificaciones.'
        );

        const markRead = await fetch(
            `${GATEWAY_URL}/api/notificaciones/${encodeURIComponent(String(notificationId))}/leida`,
            {
                method: 'POST',
                headers: { Cookie: cookie },
                signal: AbortSignal.timeout(30000)
            }
        );
        await leerRespuesta(markRead, 'Marcar notificación como leída');
        assert.equal(markRead.status, 200);

        const updatedCenterResponse = await fetch(`${GATEWAY_URL}/api/notificaciones/eventos`, {
            headers: { Cookie: cookie },
            signal: AbortSignal.timeout(30000)
        });
        const updatedCenter = await leerRespuesta(updatedCenterResponse, 'Verificación de lectura');
        assert.ok(updatedCenter.some(notification =>
            String(notification.id_notificacion) === String(notificationId) &&
            notification.estado_lectura === 'LEIDA'
        ), 'El backend no persistió el estado LEIDA.');
    } finally {
        if (cookie && notificationId !== undefined) {
            const cleanup = await fetch(
                `${GATEWAY_URL}/api/notificaciones/${encodeURIComponent(String(notificationId))}`,
                {
                    method: 'DELETE',
                    headers: { Cookie: cookie },
                    signal: AbortSignal.timeout(10000)
                }
            );
            assert.ok(
                cleanup.ok,
                `No se pudo limpiar la notificación de prueba: HTTP ${cleanup.status}.`
            );
        }
    }
});
