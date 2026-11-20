const assert = require('node:assert/strict');
const amqp = require('amqplib');
const { getPool, closePool } = require('../../../src/config/database');

const EXCHANGE_PANEL = 'panel.evento.notificaciones.v1';
const TOPICO_PANEL = 'panel.evento.notificaciones.v1';
const EXCHANGE_PLATAFORMA = 'ticketu.events';
const COLA_NOTIFICACIONES = 'notificaciones.' + TOPICO_PANEL;
const API_PANEL = 'http://panel:3000/api/organizador/v1/panel/eventos';

const ORGANIZADORA_A = '3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a';
const ORGANIZADOR_B = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const FERIA = {
    id: '66f1a0000000000000000002',
    nombre: 'Feria de Innovación TITEC',
    fecha: '2026-11-27 10:00:00'
};
const CHARLA = {
    id: '66f1a0000000000000000003',
    nombre: 'Charla de Ciberseguridad',
    fecha: '2026-12-03 17:00:00'
};
const AJEDREZ = {
    id: '66f1b0000000000000000001',
    nombre: 'Torneo Interuniversitario de Ajedrez',
    fecha: '2026-11-26 09:00:00'
};
const CORO = '66f1a0000000000000000005';

const COMPRADORES = ['qa-comprador-1', 'qa-comprador-2'];
const COMPRADOR_INACTIVO = 'qa-comprador-inactivo';
const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));

async function esperarResultado(consultar, error, timeoutMs = 15_000) {
    const vence = Date.now() + timeoutMs;
    while (Date.now() < vence) {
        const resultado = await consultar();
        if (resultado) return resultado;
        await esperar(250);
    }
    throw new Error(error);
}

async function consultarPanel(ruta, { metodo = 'GET', sesion = 'token-org-a', cuerpo } = {}) {
    const respuesta = await fetch(API_PANEL + ruta, {
        method: metodo,
        headers: { Cookie: 'jwt=' + sesion, 'Content-Type': 'application/json' },
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(6_000)
    });
    return { status: respuesta.status, datos: await respuesta.json() };
}

async function prepararEntradas(pool, evento) {
    await pool.query(
        `INSERT INTO public.entradas_usuario
            (id_usuario, id_evento, correo_comprador, nombre_evento, fecha_evento, entrada_activa)
         SELECT compra.id_usuario, $1, compra.id_usuario || '@example.invalid', $2, $3::timestamp, compra.activa
         FROM unnest($4::text[], $5::boolean[]) AS compra(id_usuario, activa)`,
        [evento.id, evento.nombre, evento.fecha, [...COMPRADORES, COMPRADOR_INACTIVO], [true, true, false]]
    );
}

async function comprobarConsumidor(conexion) {
    await esperarResultado(async () => {
        const canal = await conexion.createChannel();
        canal.on('error', () => {});
        try {
            const cola = await canal.checkQueue(COLA_NOTIFICACIONES);
            return cola.consumerCount === 1;
        } catch (error) {
            if (error.code !== 404) throw error;
            return false;
        } finally {
            await canal.close().catch(() => {});
        }
    }, 'Notificaciones no conectó su consumidor de Panel.');
}

async function observar(canal, exchange, routingKey, recibidos) {
    const cola = await canal.assertQueue('', { exclusive: true, autoDelete: true });
    await canal.bindQueue(cola.queue, exchange, routingKey);
    await canal.consume(cola.queue, mensaje => {
        if (mensaje) recibidos.push(mensaje);
    }, { noAck: true });
}

async function comprobarPublicacion(mensajes, idEvento, tipo, cuerpoEsperado) {
    const copias = await esperarResultado(() => {
        const delEvento = mensajes.filter(mensaje =>
            mensaje.properties.headers?.id_evento === idEvento &&
            mensaje.fields.routingKey === TOPICO_PANEL
        );
        return delEvento.length >= 2 ? delEvento : false;
    }, 'Faltan las dos publicaciones de Panel para ' + idEvento);

    assert.deepEqual(
        copias.map(mensaje => mensaje.fields.exchange).sort(),
        [EXCHANGE_PANEL, EXCHANGE_PLATAFORMA].sort()
    );
    for (const copia of copias) {
        assert.equal(copia.properties.type, tipo);
        assert.deepEqual(JSON.parse(copia.content.toString('utf8')), cuerpoEsperado);
    }
}

async function obtenerAvisos(pool, idEvento) {
    const resultado = await pool.query(
        `SELECT n.id_notificacion, n.id_usuario, n.tipo, n.canal, n.datos, e.estado_envio
         FROM public.notificacion n
         LEFT JOIN public.envios_notificacion e USING (id_notificacion)
         WHERE n.datos->>'id_evento' = $1
         ORDER BY n.id_notificacion`,
        [idEvento]
    );
    return resultado.rows;
}

async function comprobarAvisos(pool, evento, tipoComprador, idOrganizador) {
    const avisos = await esperarResultado(async () => {
        const filas = await obtenerAvisos(pool, evento.id);
        return filas.filter(fila => fila.estado_envio === 'ENVIADO').length >= 3 ? filas : false;
    }, 'Faltan avisos de comprador u organizador para ' + evento.nombre);

    assert.equal(avisos.length, 3);
    assert.ok(avisos.every(aviso => aviso.canal === 'APP' && aviso.estado_envio === 'ENVIADO'));

    const compradores = avisos.filter(aviso => aviso.id_usuario !== idOrganizador);
    assert.deepEqual(compradores.map(aviso => aviso.id_usuario).sort(), COMPRADORES);
    assert.ok(compradores.every(aviso => aviso.tipo === tipoComprador));

    const resumen = avisos.find(aviso => aviso.id_usuario === idOrganizador);
    assert.equal(resumen?.tipo, 'CAMBIO_EVENTO');
    assert.equal(resumen.datos.usuarios_notificados, 2);
    assert.equal(resumen.datos.usuarios_faltantes, 0);
    console.log('Avisos APP para ' + evento.nombre + ': ' + avisos.map(aviso => aviso.id_notificacion).join(', '));
    return compradores;
}

async function probarFeria(pool, mensajes) {
    const nuevaFecha = '2026-12-13';
    const nuevaHora = '20:00';
    const respuesta = await consultarPanel('/mios/' + FERIA.id, {
        metodo: 'PATCH',
        cuerpo: { fecha_evento: nuevaFecha, hora_evento: nuevaHora }
    });

    assert.equal(respuesta.status, 200, JSON.stringify(respuesta.datos));
    assert.equal(respuesta.datos.fecha_evento, nuevaFecha);
    await comprobarPublicacion(mensajes, FERIA.id, 'evento_reprogramado', {
        id_evento: FERIA.id,
        id_usuario: ORGANIZADORA_A,
        nuevo_estado: 'PUBLICADO',
        fecha_cambio: nuevaFecha,
        hora_cambio: nuevaHora + ':00'
    });
    const avisos = await comprobarAvisos(pool, FERIA, 'CAMBIO_EVENTO', ORGANIZADORA_A);
    for (const aviso of avisos) {
        assert.equal(aviso.datos.fecha_evento, nuevaFecha);
        assert.equal(aviso.datos.hora_evento, nuevaHora + ':00');
    }
    const fechas = await pool.query(
        "SELECT DISTINCT to_char(fecha_evento, 'YYYY-MM-DD HH24:MI:SS') AS fecha FROM public.entradas_usuario WHERE id_evento = $1",
        [FERIA.id]
    );
    assert.deepEqual(fechas.rows, [{ fecha: '2026-12-13 20:00:00' }]);
}

async function probarCharla(pool, mensajes) {
    const respuesta = await consultarPanel('/mios/' + CHARLA.id, { metodo: 'DELETE' });
    assert.equal(respuesta.status, 200, JSON.stringify(respuesta.datos));
    assert.equal(respuesta.datos.resultado, 'CANCELADO');
    await comprobarPublicacion(mensajes, CHARLA.id, 'evento_actualizado', {
        id_evento: CHARLA.id,
        id_usuario: ORGANIZADORA_A,
        nuevo_estado: 'CANCELADO'
    });
    await comprobarAvisos(pool, CHARLA, 'CANCELACION_EVENTO', ORGANIZADORA_A);

    const estados = await pool.query(
        'SELECT DISTINCT estado_evento FROM public.entradas_usuario WHERE id_evento = $1',
        [CHARLA.id]
    );
    assert.deepEqual(estados.rows, [{ estado_evento: 'CANCELADO' }]);
}

async function probarAjedrez(pool, mensajes) {
    const ruta = '/mios/' + AJEDREZ.id;
    const cambio = { fecha_evento: '2026-12-12', hora_evento: '14:00' };

    const sinPermiso = await consultarPanel(ruta, { metodo: 'PATCH', cuerpo: cambio });
    assert.equal(sinPermiso.status, 403, JSON.stringify(sinPermiso.datos));

    const propietario = await consultarPanel(ruta, {
        metodo: 'PATCH', sesion: 'token-org-b', cuerpo: cambio
    });
    assert.equal(propietario.status, 200, JSON.stringify(propietario.datos));
    await comprobarPublicacion(mensajes, AJEDREZ.id, 'evento_reprogramado', {
        id_evento: AJEDREZ.id,
        id_usuario: ORGANIZADOR_B,
        nuevo_estado: 'PUBLICADO',
        fecha_cambio: cambio.fecha_evento,
        hora_cambio: cambio.hora_evento + ':00'
    });
    await comprobarAvisos(pool, AJEDREZ, 'CAMBIO_EVENTO', ORGANIZADOR_B);
    console.log('Propiedad de Ajedrez verificada: HTTP 403 para otra cuenta y HTTP 200 para el dueño.');
}

async function comprobarHistorial() {
    for (const id of [CHARLA.id, CORO]) {
        const historial = await consultarPanel('/' + id + '/cambios-estado');
        assert.equal(historial.status, 200, JSON.stringify(historial.datos));
        assert.ok(historial.datos.some(cambio => cambio.nuevo_estado === 'CANCELADO'));
    }
    console.log('Historial de cancelación comprobado para Charla y Coro.');
}

async function operarEventoSinVentas(mensajes) {
    const creado = await consultarPanel('', {
        metodo: 'POST',
        cuerpo: {
            nombre_evento: 'Evento QA sin ventas',
            descripcion: 'Control de los eventos que no generan avisos.',
            fecha_evento: '2026-12-17',
            hora_evento: '15:00',
            hora_fin_evento: '16:00',
            direccion_evento: 'Auditorio QA',
            categoria: 'academico',
            cantidad_entradas: 5,
            tipo_entrada: 'GRATUITA'
        }
    });
    assert.equal(creado.status, 201, JSON.stringify(creado.datos));
    const id = creado.datos.id_evento;
    const publicado = await consultarPanel('/mios/' + id + '/publicar', { metodo: 'POST' });
    assert.equal(publicado.status, 200, JSON.stringify(publicado.datos));
    const eliminado = await consultarPanel('/mios/' + id, { metodo: 'DELETE' });
    assert.equal(eliminado.status, 200, JSON.stringify(eliminado.datos));
    assert.equal(eliminado.datos.resultado, 'ELIMINADO');

    const tipos = ['evento_creado', 'evento_publicado', 'evento_eliminado'];
    await esperarResultado(() => tipos.every(tipo => mensajes.some(mensaje =>
        mensaje.fields.exchange === EXCHANGE_PLATAFORMA &&
        mensaje.properties.type === tipo &&
        mensaje.properties.headers?.id_evento === id
    )), 'No se observaron los tres mensajes de control del evento sin ventas.');
    return id;
}

async function main() {
    const base = new URL(process.env.DATABASE_URL);
    const rabbit = new URL(process.env.BROKER_URL);
    assert.equal(base.hostname + base.pathname, 'postgres/notificaciones_panel_test',
        'Ejecuta esta prueba con el PostgreSQL aislado del Compose.');
    assert.equal(rabbit.hostname + rabbit.pathname, 'rabbit/ticketu',
        'Ejecuta esta prueba con el RabbitMQ aislado del Compose.');
    for (const evento of [FERIA, CHARLA, AJEDREZ]) {
        assert.ok(new Date(evento.fecha.replace(' ', 'T') + 'Z').getTime() > Date.now(),
            'El evento fijo ya inició: ' + evento.nombre + '. Actualiza los datos acordados con Panel para otra fecha.');
    }

    const conexion = await amqp.connect(process.env.BROKER_URL);
    try {
        const pool = getPool();
        await comprobarConsumidor(conexion);
        const canal = await conexion.createChannel();
        await canal.assertExchange(EXCHANGE_PANEL, 'topic', { durable: true });
        await canal.assertExchange(EXCHANGE_PLATAFORMA, 'topic', { durable: true });
        const mensajes = [];
        await observar(canal, EXCHANGE_PANEL, TOPICO_PANEL, mensajes);
        await observar(canal, EXCHANGE_PLATAFORMA, 'panel.evento.#', mensajes);

        for (const evento of [FERIA, CHARLA, AJEDREZ]) await prepararEntradas(pool, evento);
        await probarFeria(pool, mensajes);
        await probarCharla(pool, mensajes);
        await comprobarHistorial();
        const sinVentas = await operarEventoSinVentas(mensajes);
        // Esta publicación posterior confirma que el observador del exchange seguía recibiendo mensajes.
        await probarAjedrez(pool, mensajes);

        assert.ok(!mensajes.some(mensaje =>
            mensaje.properties.headers?.id_evento === sinVentas &&
            (mensaje.fields.exchange === EXCHANGE_PANEL || mensaje.fields.routingKey === TOPICO_PANEL)
        ), 'Panel publicó un mensaje para Notificaciones al operar un evento sin ventas.');
        assert.equal((await obtenerAvisos(pool, sinVentas)).length, 0);
        console.log('Crear, publicar y eliminar sin ventas: cero mensajes para Notificaciones y cero avisos.');
        console.log('PASS: integración real Panel → RabbitMQ → Notificaciones.');
    } finally {
        await conexion.close();
    }
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => closePool());
