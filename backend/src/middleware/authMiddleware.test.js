
    assert.equal(consultas, 0);
});

test('propaga respuestas 401 y 403 de Auth', async () => {
    const originalUrl = process.env.AUTH_SERVICE_URL;
    process.env.AUTH_SERVICE_URL = 'http://auth.test';

    try {
        for (const status of [401, 403]) {
            const middleware = crearAuthMiddleware(async () => ({ status, ok: false }));
            const res = crearResponse();
            await middleware({ headers: { cookie: 'jwt=token' } }, res, () => assert.fail('No debe continuar'));
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
        await noDisponible({ headers: { cookie: 'jwt=token' } }, resNoDisponible, () => assert.fail('No debe continuar'));
        assert.equal(resNoDisponible.statusCode, 503);

        const perfilInvalido = crearAuthMiddleware(async () => ({
            status: 200,
            ok: true,
            json: async () => ({ valido: true, usuario: {} })
        }));
        const resPerfilInvalido = crearResponse();
        await perfilInvalido({ headers: { cookie: 'jwt=token' } }, resPerfilInvalido, () => assert.fail('No debe continuar'));
        assert.equal(resPerfilInvalido.statusCode, 502);
    } finally {
        if (originalUrl === undefined) delete process.env.AUTH_SERVICE_URL;
        else process.env.AUTH_SERVICE_URL = originalUrl;
    }
});

error.handler:
function errorHandler(err, req, res, next) {
    console.error(err);

    const status = err.statusCode || 500;
    res.status(status).json({
        error: err.message || 'Error interno del servidor'
    });
}

module.exports = errorHandler;