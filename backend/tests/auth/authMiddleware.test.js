const assert = require('node:assert/strict');
const test = require('node:test');
const { crearAuthMiddleware } = require('../../src/middleware/authMiddleware');

function crearResponse() {
    return {
        statusCode: 200,
        headers: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
        set(name, value) {
            this.headers[name] = value;
            return this;
        }
    };
}

test('valida con Auth reenviando la cookie original y asigna el perfil', async () => {
    const originalUrl = process.env.AUTH_SERVICE_URL;
    const originalTimeout = process.env.AUTH_TIMEOUT_MS;
    process.env.AUTH_SERVICE_URL = 'http://auth.test:4000';
    process.env.AUTH_TIMEOUT_MS = '1200';

    try {
        let llamada;
        const middleware = crearAuthMiddleware(async (url, options) => {
            llamada = { url, options };
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    valido: true,
                    usuario: { id_usuario: 'usuario-auth', rol: 'usuario' }
                })
            };
        });
        const req = { headers: { cookie: 'otra=valor; jwt_token=token-original' } };
        const res = crearResponse();
        let siguiente = false;

        await middleware(req, res, () => { siguiente = true; });

        assert.equal(llamada.url, 'http://auth.test:4000/api/auth/validar-sesion');
        assert.equal(llamada.options.method, 'GET');
        assert.equal(llamada.options.headers.Cookie, 'otra=valor; jwt_token=token-original');
        assert.ok(llamada.options.signal instanceof AbortSignal);
        assert.deepEqual(req.user, { id_usuario: 'usuario-auth', rol: 'usuario' });
        assert.equal(res.headers['Cache-Control'], 'no-store');
        assert.equal(siguiente, true);
    } finally {
        if (originalUrl === undefined) delete process.env.AUTH_SERVICE_URL;
        else process.env.AUTH_SERVICE_URL = originalUrl;
        if (originalTimeout === undefined) delete process.env.AUTH_TIMEOUT_MS;
        else process.env.AUTH_TIMEOUT_MS = originalTimeout;
    }
});

test('rechaza una cookie ausente o sin jwt sin consultar Auth', async () => {
    let consultas = 0;
    const middleware = crearAuthMiddleware(async () => { consultas++; });

    for (const cookie of [undefined, 'otra=valor', 'jwt=token', 'jwt_token=']) {
        const res = crearResponse();
        await middleware({ headers: { cookie } }, res, () => assert.fail('No debe continuar'));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(consultas, 0);
});

test('propaga respuestas 401 y 403 de Auth', async () => {
    const originalUrl = process.env.AUTH_SERVICE_URL;
    process.env.AUTH_SERVICE_URL = 'http://auth.test';

    try {
        for (const status of [401, 403]) {
            const middleware = crearAuthMiddleware(async () => ({ status, ok: false }));
            const res = crearResponse();
            await middleware({ headers: { cookie: 'jwt_token=token' } }, res, () => assert.fail('No debe continuar'));
            assert.equal(res.statusCode, status);
        }
    } finally {
        if (originalUrl === undefined) delete process.env.AUTH_SERVICE_URL;
        else process.env.AUTH_SERVICE_URL = originalUrl;
    }
});

test('responde 503 si Auth no está disponible y 502 ante un perfil inválido', async () => {
    const originalUrl = process.env.AUTH_SERVICE_URL;
    process.env.AUTH_SERVICE_URL = 'http://auth.test';

    try {
        const noDisponible = crearAuthMiddleware(async () => { throw new Error('connection refused'); });
        const resNoDisponible = crearResponse();
        await noDisponible({ headers: { cookie: 'jwt_token=token' } }, resNoDisponible, () => assert.fail('No debe continuar'));
        assert.equal(resNoDisponible.statusCode, 503);

        const perfilInvalido = crearAuthMiddleware(async () => ({
            status: 200,
            ok: true,
            json: async () => ({ valido: true, usuario: {} })
        }));
        const resPerfilInvalido = crearResponse();
        await perfilInvalido({ headers: { cookie: 'jwt_token=token' } }, resPerfilInvalido, () => assert.fail('No debe continuar'));
        assert.equal(resPerfilInvalido.statusCode, 502);
    } finally {
        if (originalUrl === undefined) delete process.env.AUTH_SERVICE_URL;
        else process.env.AUTH_SERVICE_URL = originalUrl;
    }
});
