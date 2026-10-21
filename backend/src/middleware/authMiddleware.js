function crearAuthMiddleware(fetchSession = globalThis.fetch) {
    return async function autenticarSesion(req, res, next) {
        const cookie = req.headers.cookie;
        if (!cookie || !/(^|;\s*)jwt_token=[^;]+/.test(cookie)) {
            return res.status(401).json({
                valido: false,
                codigo_http: 401,
                error: 'unauthorized',
                mensaje: 'La sesión ha expirado, es inválida o fue revocada.'
            });
        }

        const authServiceUrl = process.env.AUTH_SERVICE_URL;
        if (!authServiceUrl) {
            console.error('[auth] Falta configurar AUTH_SERVICE_URL.');
            return res.status(503).json({ error: 'Servicio de autenticación no disponible' });
        }

        const timeoutMs = Number(process.env.AUTH_TIMEOUT_MS || 5000);
        if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) {
            console.error('[auth] AUTH_TIMEOUT_MS debe ser un número mayor que cero.');
            return res.status(503).json({ error: 'Servicio de autenticación no disponible' });
        }

        let validationUrl;
        try {
            validationUrl = new URL('/api/auth/validar-sesion', authServiceUrl);
            if (!['http:', 'https:'].includes(validationUrl.protocol)) {
                throw new Error('AUTH_SERVICE_URL debe usar HTTP o HTTPS');
            }
        } catch (error) {
            console.error('[auth] AUTH_SERVICE_URL inválida:', error.message);
            return res.status(503).json({ error: 'Servicio de autenticación no disponible' });
        }

        let authResponse;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            authResponse = await fetchSession(validationUrl.toString(), {
                method: 'GET',
                headers: { Cookie: cookie },
                signal: controller.signal
            });
        } catch (error) {
            console.error('[auth] No fue posible validar la sesión:', error.message);
            return res.status(503).json({ error: 'Servicio de autenticación no disponible' });
        } finally {
            clearTimeout(timeout);
        }

        if (authResponse.status === 401 || authResponse.status === 403) {
            return res.status(authResponse.status).json({
                valido: false,
                codigo_http: authResponse.status,
                error: authResponse.status === 401 ? 'unauthorized' : 'forbidden',
                mensaje: authResponse.status === 401
                    ? 'La sesión ha expirado, es inválida o fue revocada.'
                    : 'El servicio no está autorizado para acceder a Auth.'
            });
        }
        if (authResponse.status === 500 || authResponse.status === 503) {
            return res.status(authResponse.status).json({ error: 'Servicio de autenticación no disponible' });
        }
        if (!authResponse.ok) {
            console.error(`[auth] Respuesta inesperada de Auth: HTTP ${authResponse.status}.`);
            return res.status(502).json({ error: 'Respuesta inválida del servicio de autenticación' });
        }

        let perfil;
        try {
            perfil = await authResponse.json();
        } catch (error) {
            console.error('[auth] Auth devolvió una respuesta JSON inválida:', error.message);
            return res.status(502).json({ error: 'Respuesta inválida del servicio de autenticación' });
        }

        const usuario = perfil?.valido === true ? perfil.usuario : null;
        if (!usuario || typeof usuario.id_usuario !== 'string' || !usuario.id_usuario.trim()) {
            console.error('[auth] Auth respondió 200 sin un perfil válido de usuario.');
            return res.status(502).json({ error: 'Respuesta inválida del servicio de autenticación' });
        }

        res.set('Cache-Control', 'no-store');
        req.user = {
            id_usuario: usuario.id_usuario,
            rol: usuario.rol
        };
        return next();
    };
}

module.exports = crearAuthMiddleware();
module.exports.crearAuthMiddleware = crearAuthMiddleware;
