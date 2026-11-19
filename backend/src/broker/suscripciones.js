const broker = require('./index');
const { manejarEntradaEmitida } = require('../events/entradaEmitidaHandler');
const { manejarRecuperacionCuenta, manejarCrearCuenta } = require('../events/authHandler');
const panelEventoHandler = require('../events/panelEventoHandler');
const { procesarUnaVez } = require('../services/eventDeduplicationService');

const EXCHANGE_ENTRADAS = 'entradas.events';
const EXCHANGE_AUTH = 'auth.events';
const PANEL_EXCHANGES_DEFAULT = 'ticketu.events,panel.evento.notificaciones.v1';
const PANEL_ROUTING_KEY = process.env.PANEL_EVENT_ROUTING_KEY || 'panel.evento.notificaciones.v1';
const PANEL_QUEUE = process.env.PANEL_EVENT_QUEUE || 'notificaciones.panel_eventos.v1';
const PANEL_LOGICAL_EXCHANGE = 'panel.evento.notificaciones.v1';

function obtenerPanelExchanges() {
    const raw = process.env.PANEL_EVENT_EXCHANGES || PANEL_EXCHANGES_DEFAULT;
    return [...new Set(raw.split(',').map(value => value.trim()).filter(Boolean))];
}

function suscribirEvento(exchange, routingKey, handler) {
    return broker.subscribeToExchange(exchange, routingKey, evento =>
        procesarUnaVez(exchange, routingKey, evento, () => handler(evento))
    );
}

function extraerPayload(body) {
    if (body && typeof body === 'object' && body.payload && typeof body.payload === 'object') {
        return body.payload;
    }
    return body;
}

async function manejarMensajePanel(body, propiedades = {}) {
    const evento = extraerPayload(body);
    const tipo = String(
        propiedades.type || body?.envelope?.tipo || body?.tipo || ''
    ).trim();

    if (!['evento_actualizado', 'evento_reprogramado'].includes(tipo)) {
        throw new Error(`Tipo AMQP de Panel no reconocido: "${tipo || '(vacío)'}".`);
    }
    if (!evento || typeof evento !== 'object' || Array.isArray(evento)) {
        throw new Error('El cuerpo del mensaje de Panel debe ser un objeto JSON.');
    }

    // El mismo outbox messageId se publica en ticketu.events y en el exchange
    // dedicado. Incluirlo en la huella evita duplicados entre ambos exchanges,
    // pero permite procesar cambios posteriores con el mismo payload.
    const eventoParaDeduplicar = propiedades.messageId
        ? { ...evento, __amqp_message_id: String(propiedades.messageId) }
        : evento;
    return procesarUnaVez(PANEL_LOGICAL_EXCHANGE, tipo, eventoParaDeduplicar, () =>
        tipo === 'evento_actualizado'
            ? panelEventoHandler.manejarEventoActualizado(evento)
            : panelEventoHandler.manejarEventoReprogramado(evento)
    );
}

async function suscribirEventosPanel() {
    if (typeof broker.subscribePanelEvents !== 'function') {
        throw new Error('La implementación del broker no soporta suscripciones con propiedad AMQP type.');
    }
    return broker.subscribePanelEvents({
        exchanges: obtenerPanelExchanges(),
        routingKey: PANEL_ROUTING_KEY,
        queueName: PANEL_QUEUE,
        handler: manejarMensajePanel
    });
}

async function registrarSuscripciones() {
    await Promise.all([
        suscribirEvento(EXCHANGE_ENTRADAS, 'entradas_emitidas', manejarEntradaEmitida),
        suscribirEvento(EXCHANGE_AUTH, 'recuperacion_cuenta', manejarRecuperacionCuenta),
        suscribirEvento(EXCHANGE_AUTH, 'cuenta_staff', manejarCrearCuenta),
        suscribirEventosPanel()
    ]);
}

const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));

// Mantiene el servidor HTTP arriba y recupera las suscripciones cuando el broker
// no está disponible al arrancar o cuando la conexión se interrumpe.
async function supervisarSuscripciones() {
    let intentos = 0;
    for (;;) {
        try {
            await registrarSuscripciones();
            intentos = 0;
            if (typeof broker.esperarDesconexion !== 'function') return;
            await broker.esperarDesconexion();
            console.warn('[broker] Conexión cerrada; se volverán a registrar las suscripciones.');
        } catch (error) {
            intentos += 1;
            const demora = Math.min(30000, 1000 * (2 ** Math.min(intentos - 1, 5)));
            console.error(`[broker] No se pudieron registrar las suscripciones. Reintento en ${demora} ms:`, error.message);
            if (typeof broker.cerrar === 'function') await broker.cerrar().catch(() => {});
            await esperar(demora);
        }
    }
}

module.exports = {
    iniciarSuscripciones: registrarSuscripciones,
    registrarSuscripciones,
    supervisarSuscripciones,
    suscribirEvento,
    suscribirEventosPanel,
    manejarMensajePanel,
    obtenerPanelExchanges,
    PANEL_ROUTING_KEY,
    PANEL_QUEUE
};
