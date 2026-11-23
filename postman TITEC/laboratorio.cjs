'use strict';

const http = require('node:http');
const net = require('node:net');
const { randomUUID, createHash } = require('node:crypto');
const { setTimeout: sleep } = require('node:timers/promises');
const amqp = require('/app/node_modules/amqplib');
const { getPool } = require('/app/src/config/database');
const appCanal = require('/app/src/services/canalEnvioService');
const jobs = require('/app/src/jobs/notificacionJobs');

const A = 'qa-comprador-a';
const B = 'qa-comprador-b';
const ORG = 'qa-organizador';
const SMTP = new Map();
const appFaults = new Map();
const programados = new Map();
const authRequests = [];
const trazas = [];
const confirmaciones = [];
const pool = getPool();
const DAY = 86400000;
let channel;

// Las inyecciones actúan únicamente en el proceso del laboratorio.
for (const nivel of ['log', 'info', 'warn', 'error']) {
    const original = console[nivel].bind(console);
    console[nivel] = (...args) => {
        trazas.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        if (trazas.length > 6000) trazas.shift();
        original(...args);
    };
}

const enviarApp = appCanal.enviarNotificacion;
appCanal.enviarNotificacion = async n => {
    const key = [n.datos?.id_evento, n.id_usuario, n.tipo].join('/');
    const pendientes = appFaults.get(key) || 0;
    if (pendientes > 0) {
        appFaults.set(key, pendientes - 1);
        throw new Error('QA fallo controlado del canal APP');
    }
    return enviarApp(n);
};
const programar = jobs.programarTrabajoRecordatorio;
jobs.programarTrabajoRecordatorio = (key, fecha, ejecutar) => {
    programados.set(key, { fecha: fecha.toISOString(), ejecutar });
    return programar(key, fecha, ejecutar);
};

function auth(req, res) {
    const cookie = req.headers.cookie || '';
    const token = /(?:^|;\s*)jwt=([^;]+)/.exec(cookie)?.[1];
    authRequests.push({ path: req.url, cookie, clave: req.headers['x-api-key'] === process.env.INTERNAL_API_KEY });
    if (!authRequests.at(-1).clave) return res.writeHead(403).end();
    if (token === 'qa-sin-respuesta') return req.socket.destroy();
    if (token === 'qa-timeout') return; // La aplicación debe agotar su propio timeout.
    const respuestas = {
        'qa-rechazo': [401, {}],
        'qa-prohibido': [403, {}],
        'qa-error-auth': [500, {}],
        'qa-no-disponible': [503, {}],
        'qa-sin-identidad': [200, { valido: true }],
        'qa-id-vacio': [200, { valido: true, usuario: { id_usuario: ' ' } }],
        'qa-id-numerico': [200, { valido: true, usuario: { id_usuario: 9 } }]
    };
    const id = token === 'qa-cookie-prueba' ? A : token;
    const valido = [A, B, ORG].includes(id) || /^qa-carga-\d+$/.test(id);
    const [status, payload] = respuestas[token] || (valido
        ? [200, { valido: true, usuario: { id_usuario: id, rol: id === ORG ? 'organizador' : 'usuario' } }]
        : [401, { valido: false }]);
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(payload));
}

// SMTP local. Cada destinatario de prueba tiene éxito, un fallo o tres fallos.
function smtp(socket) {
    let input = '';
    let leyendo = false;
    let data = [];
    let destinatario;
    const responder = texto => socket.write(texto + '\r\n');
    responder('220 laboratorio.ticketu.test ESMTP');
    socket.setEncoding('utf8');
    socket.on('error', () => {});
    socket.on('data', chunk => {
        input += chunk;
        let index;
        while ((index = input.indexOf('\r\n')) >= 0) {
            const line = input.slice(0, index);
            input = input.slice(index + 2);
            if (leyendo) {
                if (line !== '.') {
                    data.push(line.startsWith('..') ? line.slice(1) : line);
                    continue;
                }
                leyendo = false;
                const history = SMTP.get(destinatario) || [];
                const fallos = destinatario.startsWith('persistente-') ? 3 : destinatario.startsWith('transitorio-') ? 1 : 0;
                const aceptado = history.length >= fallos;
                const contenido = data.join('\r\n').replace(/=\r\n/g, '').replace(/=([A-F0-9]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
                history.push({ destinatario, aceptado, contenido });
                SMTP.set(destinatario, history);
                data = [];
                responder(aceptado ? '250 mensaje capturado' : '451 fallo SMTP controlado');
            } else if (/^(EHLO|HELO)\s/i.test(line)) {
                responder('250-laboratorio.ticketu.test\r\n250 AUTH PLAIN');
            } else if (/^AUTH PLAIN\s/i.test(line)) {
                responder('235 autenticado');
            } else if (/^RCPT TO:/i.test(line)) {
                destinatario = /<([^>]+)>/.exec(line)?.[1];
                responder(destinatario?.endsWith('@ticketu.test') ? '250 destinatario local' : '550 solo destinatarios de laboratorio');
            } else if (line === 'DATA') {
                leyendo = true;
                responder('354 escribir mensaje');
            } else if (line === 'QUIT') {
                socket.end('221 adios\r\n');
            } else {
                responder('250 ok');
            }
        }
    });
}

const app = require('/app/app');
const { iniciarSuscripciones } = require('/app/src/broker/suscripciones');

function fecha(offsetMs) {
    const iso = new Date(Date.now() + offsetMs).toISOString();
    return { dia: iso.slice(0, 10), hora: iso.slice(11, 16), iso };
}

async function esperar(fn, label) {
    const limite = Date.now() + 8500;
    while (Date.now() < limite) {
        const valor = await fn();
        if (valor) return valor;
        await sleep(40);
    }
    throw new Error('Tiempo agotado: ' + label);
}

async function publicar(exchange, key, data, type) {
    channel.publish(exchange, key, Buffer.from(JSON.stringify(data)), { type, contentType: 'application/json' });
    await channel.waitForConfirms();
}

function formatoOrdenado(value) {
    if (Array.isArray(value)) return '[' + value.map(formatoOrdenado).join(',') + ']';
    if (value && typeof value === 'object') {
        return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + formatoOrdenado(value[k])).join(',') + '}';
    }
    return JSON.stringify(value);
}

function procesado(exchange, key, data) {
    const hash = createHash('sha256').update(formatoOrdenado(data)).digest('hex');
    const clave = [exchange, key, 'sha256', hash].join(':');
    return esperar(async () => (await pool.query('SELECT 1 FROM eventos_procesados WHERE clave_evento=$1', [clave])).rowCount > 0, clave);
}

async function notificaciones(idEvento) {
    const query = [
        'SELECT n.id_notificacion, n.id_usuario, n.tipo, n.canal, n.estado_lectura, n.mensaje, n.datos,',
        "COALESCE((SELECT jsonb_agg(jsonb_build_object('intento', e.intento, 'estado', e.estado_envio, 'error', e.error) ORDER BY e.intento)",
        "FROM envios_notificacion e WHERE e.id_notificacion=n.id_notificacion), '[]') AS envios",
        "FROM notificacion n WHERE n.datos->>'id_evento'=$1 ORDER BY n.id_notificacion"
    ].join(' ');
    return (await pool.query(query, [idEvento])).rows;
}

function compra(modo, offset) {
    const id = randomUUID();
    const f = fecha(offset);
    return {
        id_evento: 'qa-' + id, id_usuario: A, nombre_evento: 'Evento QA ' + id,
        correo_comprador: modo + '-' + id + '@ticketu.test', nombre_comprador: 'Comprador QA',
        fecha_evento: f.dia, hora_evento: f.hora, qr_data: 'https://ticketu.test/qr/' + id
    };
}

async function casoCompra({
    modo = 'exitoso', offsetHoras = 48, duplicar = false, recordatorioFallos = 0, compraAppFallos = 0
}) {
    const data = compra(modo, offsetHoras * 3600000);
    const comienzo = confirmaciones.length;
    if (recordatorioFallos) appFaults.set([data.id_evento, A, 'RECORDATORIO_24H'].join('/'), recordatorioFallos);
    if (compraAppFallos) appFaults.set([data.id_evento, A, 'COMPRA'].join('/'), compraAppFallos);
    await publicar('entradas.events', 'entradas_emitidas', data);
    if (duplicar) await publicar('entradas.events', 'entradas_emitidas', data);
    await procesado('entradas.events', 'entradas_emitidas', data);
    if (duplicar) {
        await publicar('entradas.events', 'entradas_emitidas', data);
        await sleep(200);
    }
    const row = (await pool.query('SELECT id_usuario, correo_comprador, nombre_evento FROM entradas_usuario WHERE id_evento=$1', [data.id_evento])).rows[0];
    return {
        data, entrada: row, avisos: await notificaciones(data.id_evento),
        smtp: SMTP.get(data.correo_comprador) || [],
        confirmaciones: confirmaciones.slice(comienzo),
        programacion: programados.get([A, data.id_evento].join(':'))?.fecha ?? null
    };
}

async function esperarRechazo(exchange, key, data, type) {
    const inicio = trazas.length;
    await publicar(exchange, key, data, type);
    return esperar(() => trazas.slice(inicio).find(l => l.includes('error procesando "' + key + '"')), 'rechazo de ' + key);
}

async function compraInvalida() {
    const requeridos = ['correo_comprador', 'nombre_comprador', 'id_usuario', 'nombre_evento', 'id_evento', 'fecha_evento', 'hora_evento', 'qr_data'];
    const resultados = [];
    for (const campo of requeridos) {
        const data = compra('exitoso', 2 * DAY);
        const id = data.id_evento;
        delete data[campo];
        const inicio = confirmaciones.length;
        const error = await esperarRechazo('entradas.events', 'entradas_emitidas', data);
        resultados.push({ campo, error, avisos: (await notificaciones(id)).length, confirmaciones: confirmaciones.length - inicio });
    }
    return resultados;
}

async function casoAuth({ tipo, modo, campoInvalido }) {
    if (!['recuperacion_cuenta', 'cuenta_staff'].includes(tipo)) throw new Error('Tipo de Auth invalido');
    const id = randomUUID();
    const email_destino = modo + '-' + id + '@ticketu.test';
    const url = 'http://auth.ticketu.test/' + tipo + '/' + id;
    const data = { id_usuario: A, email_destino, url };
    if (campoInvalido) {
        if (campoInvalido === 'protocolo') data.url = 'ftp://auth.ticketu.test/qa';
        else delete data[campoInvalido];
        const error = await esperarRechazo('auth.events', tipo, data);
        return { error, smtp: SMTP.get(email_destino) || [] };
    }
    await publicar('auth.events', tipo, data);
    await procesado('auth.events', tipo, data);
    const confirmacion = await esperar(() => confirmaciones.find(x => x.key === 'correo_auth' && x.data.email_destino === email_destino), 'confirmacion Auth');
    return { data, smtp: SMTP.get(email_destino) || [], confirmacion };
}

async function sembrarEntrada(id, user, iso, activa = true) {
    await pool.query(
        'INSERT INTO entradas_usuario (id_usuario, id_evento, correo_comprador, nombre_evento, fecha_evento, entrada_activa) VALUES ($1,$2,$3,$4,$5,$6)',
        [user, id, user + '@ticketu.test', 'Evento Panel QA', iso, activa]
    );
}

async function casoPanel({ tipo = 'evento_reprogramado', modo = 'exitoso', duplicar = false, cantidad = 2, campoInvalido = 'id_usuario' }) {
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) throw new Error('Cantidad QA de compradores fuera de rango');
    const id = 'qa-panel-' + randomUUID();
    const reprogramar = tipo === 'evento_reprogramado';
    const original = fecha(modo === 'pasado' ? -2 * DAY : 2 * DAY);
    const nueva = fecha(4 * DAY);
    const sinCompradores = modo === 'sin-compradores' || modo === 'entradas-inactivas';
    const compradores = sinCompradores ? [] : Array.from({ length: cantidad }, (_, i) => i === 0 ? A : i === 1 ? B : 'qa-carga-' + i);
    for (const user of compradores) await sembrarEntrada(id, user, original.iso);
    if (modo === 'entradas-inactivas') await sembrarEntrada(id, A, original.iso, false);
    const agendado = [A, id].join(':');
    if (modo === 'calendario') {
        const s = require('/app/src/services/recordatorioEventoService');
        await s.programarRecordatorioEvento({ id_evento: id, id_usuario: A, nombre_evento: 'Evento Panel QA', fecha_evento: original.dia, hora_evento: original.hora });
    }
    const programacionAntes = programados.get(agendado)?.fecha ?? null;
    if (modo === 'fallos') {
        const tipoApp = reprogramar ? 'CAMBIO_EVENTO' : 'CANCELACION_EVENTO';
        appFaults.set([id, A, tipoApp].join('/'), 3);
        appFaults.set([id, B, tipoApp].join('/'), 1);
        appFaults.set([id, ORG, 'CAMBIO_EVENTO'].join('/'), 3);
    }
    if (modo === 'organizador-transitorio') appFaults.set([id, ORG, 'CAMBIO_EVENTO'].join('/'), 1);
    const exchange = 'panel.evento.notificaciones.v1';
    const data = { id_evento: id, id_usuario: ORG, nuevo_estado: reprogramar ? 'PUBLICADO' : 'CANCELADO' };
    if (reprogramar) Object.assign(data, { fecha_cambio: nueva.dia, hora_cambio: nueva.hora + ':00' });
    if (modo === 'invalido') {
        if (campoInvalido === 'nuevo_estado') data.nuevo_estado = 'BORRADOR';
        else if (campoInvalido === 'fecha_cambio') data.fecha_cambio = '2027-02-30';
        else if (campoInvalido === 'hora_cambio') data.hora_cambio = '25:00:00';
        else delete data[campoInvalido];
    }
    if (modo === 'pasado' || modo === 'invalido') {
        const error = await esperarRechazo(exchange, exchange, data, tipo);
        return { data, error, avisos: await notificaciones(id) };
    }
    await publicar(exchange, exchange, data, tipo);
    if (duplicar) await publicar(exchange, exchange, data, tipo);
    await procesado(exchange, tipo, data);
    if (duplicar) {
        await publicar(exchange, exchange, data, tipo);
        await sleep(150);
    }
    if (modo === 'calendario' && !reprogramar) await programados.get(agendado).ejecutar();
    const filas = (await pool.query('SELECT id_usuario, fecha_evento, estado_evento FROM entradas_usuario WHERE id_evento=$1 ORDER BY id_usuario', [id])).rows;
    return { data, compradores, filas, avisos: await notificaciones(id), programacionAntes, programacionDespues: programados.get(agendado)?.fecha ?? null };
}

async function dbError() {
    const query = pool.query;
    pool.query = function (sql, ...args) {
        if (typeof sql === 'string' && sql.includes('INSERT INTO public.notificacion')) {
            return Promise.reject(new Error('QA fallo de almacenamiento'));
        }
        return query.call(this, sql, ...args);
    };
    const marca = 'qa-db-' + randomUUID();
    try {
        const r = await peticion(A, '/api/notificaciones', 'POST', { tipo: 'COMPRA', mensaje: marca });
        const count = (await query.call(pool, 'SELECT count(*)::int AS n FROM notificacion WHERE mensaje=$1', [marca])).rows[0].n;
        return { ...r, persistidos: count };
    } finally {
        pool.query = query;
    }
}

async function peticion(user, path, method = 'GET', data) {
    const r = await fetch('http://127.0.0.1:3000' + path, {
        method, headers: { Cookie: 'jwt=' + user, 'Content-Type': 'application/json' },
        ...(data === undefined ? {} : { body: JSON.stringify(data) })
    });
    return { status: r.status, data: await r.json() };
}

async function fechasIguales() {
    const momento = new Date();
    const ids = [];
    for (const texto of ['Primera', 'Segunda']) {
        const r = await pool.query(
            'INSERT INTO notificacion (id_usuario, tipo, mensaje, canal, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING id_notificacion',
            [A, 'COMPRA', texto, 'APP', momento]
        );
        ids.push(r.rows[0].id_notificacion);
    }
    return { ids };
}

function limites24h() {
    const inicio = new Date('2030-01-15T12:00:00Z').getTime();
    return [DAY + 1, DAY, DAY - 1].map(restante => {
        const plan = jobs.planificarRecordatorio('2030-01-15', '12:00', new Date(inicio - restante));
        return { restante, inmediato: plan.enviarAhora, programado: plan.fechaEnvio.toISOString() };
    });
}

async function vencimientoRecordatorio() {
    const data = compra('exitoso', 2 * DAY);
    const iso = fecha(2 * DAY).iso;
    await sembrarEntrada(data.id_evento, A, iso);
    const servicio = require('/app/src/services/recordatorioEventoService');
    const antes = (await notificaciones(data.id_evento)).length;
    const ejecutarEn = new Date(Date.now() + 150);
    let comienzo;
    await new Promise((resolve, reject) => {
        jobs.programarTrabajoRecordatorio(A + ':' + data.id_evento, ejecutarEn, async () => {
            try {
                comienzo = Date.now();
                await servicio.enviarRecordatorioEvento(data);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
    return { antes, inicioCorrecto: comienzo >= ejecutarEn.getTime(), avisos: await notificaciones(data.id_evento) };
}

async function carga({ modo, cantidades, maxMs }) {
    if (!['centro', 'masivas', 'sesion', 'rafaga', 'recordatorios', 'correos'].includes(modo)) throw new Error('Modo de carga invalido');
    if (!Array.isArray(cantidades) || cantidades.length === 0 || cantidades.length > 5 ||
        cantidades.some(n => !Number.isInteger(n) || n < 1 || n > 20) || !Number.isFinite(maxMs) || maxMs <= 0) {
        throw new Error('Indique hasta cinco etapas de 1 a 20 y un umbral en milisegundos');
    }
    const etapas = [];
    for (const cantidad of cantidades) {
        const tasks = Array.from({ length: cantidad }, (_, i) => i);
        const t0 = performance.now();
        const resultados = await Promise.all(tasks.map(async i => {
            const usuario = 'qa-carga-' + i;
            if (modo === 'centro' || modo === 'sesion') {
                const token = modo === 'sesion' && i % 4 === 3 ? 'qa-rechazo' : usuario;
                const aviso = await peticion(usuario, '/api/notificaciones', 'POST', { tipo: 'COMPRA', mensaje: 'Sesión concurrente QA' });
                const r = await peticion(token, '/api/notificaciones/eventos');
                return aviso.status === 201 && (token === usuario
                    ? r.status === 200 && r.data.every(n => n.id_usuario === usuario) && r.data.some(n => n.id_notificacion === aviso.data.id_notificacion)
                    : r.status === 401);
            }
            if (modo === 'masivas') {
                const ids = await Promise.all(['uno', 'dos'].map(mensaje => peticion(usuario, '/api/notificaciones', 'POST', { tipo: 'COMPRA', mensaje })));
                if (ids.some(r => r.status !== 201)) return false;
                const marcada = await peticion(usuario, '/api/notificaciones/marcar-todas-leidas', 'POST');
                const borrada = await peticion(usuario, '/api/notificaciones', 'DELETE', { ids: ids.map(r => r.data.id_notificacion) });
                const lista = await peticion(usuario, '/api/notificaciones/eventos');
                return marcada.status === 200 && marcada.data.length >= 2 && borrada.status === 200 &&
                    borrada.data.every(n => n.id_usuario === usuario && n.estado_lectura === 'ELIMINADA') &&
                    lista.status === 200 && ids.every(r => !lista.data.some(n => n.id_notificacion === r.data.id_notificacion));
            }
            const data = compra(modo === 'correos' ? ['exitoso', 'transitorio', 'persistente'][i % 3] : 'exitoso',
                modo === 'recordatorios' ? 2 * 3600000 : 2 * DAY);
            data.id_usuario = usuario;
            await publicar('entradas.events', 'entradas_emitidas', data);
            await procesado('entradas.events', 'entradas_emitidas', data);
            const notas = await notificaciones(data.id_evento);
            const intentos = { exitoso: 1, transitorio: 2, persistente: 3 };
            const esperado = intentos[data.correo_comprador.split('-')[0]];
            const email = notas.find(n => n.canal === 'EMAIL');
            return notas.length === (modo === 'recordatorios' ? 3 : 2) &&
                notas.every(n => n.id_usuario === usuario) && email.envios.length === esperado &&
                email.envios.at(-1).estado === (esperado === 3 ? 'ERROR' : 'ENVIADO') &&
                (modo !== 'recordatorios' || notas.some(n => n.tipo === 'RECORDATORIO_24H' && n.envios.at(-1).estado === 'ENVIADO'));
        }));
        etapas.push({ cantidad, correctas: resultados.filter(Boolean).length, ms: Math.round(performance.now() - t0), maxMs });
    }
    return etapas;
}

const escenarios = {
    compra: casoCompra, 'compra-invalida': compraInvalida,
    auth: casoAuth, panel: casoPanel, 'db-error': dbError,
    'fechas-iguales': fechasIguales, 'limites-24h': limites24h, 'vencimiento-recordatorio': vencimientoRecordatorio, carga,
    trazas: () => ({
        reenvio: authRequests.some(a => a.cookie === 'preferencia=es; jwt=qa-cookie-prueba; tema=claro' && a.path === '/internal/validar-sesion' && a.clave),
        tokenEnLogs: trazas.some(l => l.includes('qa-cookie-prueba') || l.includes('qa-rechazo')),
        consultas: authRequests.length
    })
};

app.get('/__qa/listo', (_req, res) => res.json({ laboratorio: 'Notificaciones', smtp: 'local', broker: 'RabbitMQ', base: 'PostgreSQL' }));
app.post('/__qa/escenarios/:nombre', async (req, res) => {
    const nombre = req.params.nombre;
    if (!Object.hasOwn(escenarios, nombre)) return res.sendStatus(404);
    try {
        res.json(await escenarios[nombre](req.body || {}));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function iniciar() {
    http.createServer(auth).listen(3092, '127.0.0.1');
    net.createServer(smtp).listen(2525, '127.0.0.1');
    const conexion = await amqp.connect(process.env.BROKER_URL);
    channel = await conexion.createConfirmChannel();
    for (const exchange of ['entradas.events', 'auth.events', 'notificaciones.events', 'panel.evento.notificaciones.v1']) {
        await channel.assertExchange(exchange, 'topic', { durable: true });
    }
    const { queue } = await channel.assertQueue('', { exclusive: true, autoDelete: true });
    await channel.bindQueue(queue, 'notificaciones.events', '#');
    await channel.consume(queue, msg => {
        if (!msg) return;
        confirmaciones.push({ key: msg.fields.routingKey, data: JSON.parse(msg.content.toString()) });
        channel.ack(msg);
    });
    await iniciarSuscripciones();
    app.listen(Number(process.env.PORT), '0.0.0.0');
}

iniciar().catch(error => {
    console.error(error.message);
    process.exit(1);
});
