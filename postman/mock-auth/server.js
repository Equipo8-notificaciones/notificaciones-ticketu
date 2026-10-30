'use strict';

// MOCK ONLY FOR LOCAL POSTMAN TESTING. This is not a replacement for Auth.
const http = require('node:http');
const PORT = Number(process.env.PORT || 10000);
const EXPECTED_TOKEN = process.env.MOCK_AUTH_TOKEN || 'postman-test-token';

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (req.method !== 'GET' || pathname !== '/api/auth/validar-sesion') {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }

  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)jwt_token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : '';

  if (!token || token !== EXPECTED_TOKEN) {
    res.writeHead(401);
    res.end(JSON.stringify({
      valido: false,
      codigo_http: 401,
      error: 'unauthorized',
      mensaje: 'Token de prueba ausente o inválido.'
    }));
    return;
  }

  res.writeHead(200);
  res.end(JSON.stringify({
    valido: true,
    usuario: {
      id_usuario: 'postman-test-user',
      rol: 'COMPRADOR'
    }
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[MOCK AUTH SOLO PRUEBAS] escuchando en puerto ${PORT}`);
});
