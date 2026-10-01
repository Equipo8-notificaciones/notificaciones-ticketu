const { EventEmitter } = require('events');

/**
 * Broker simulado en memoria para desarrollo local.
 *
 * Implementa las operaciones básicas de publicación y suscripción mediante
 * EventEmitter, permitiendo probar los manejadores de eventos sin depender
 * de una instancia de RabbitMQ.
 */
class MockBroker {
    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50);
    }

    /**
     * Publica un mensaje en un tópico.
     * @param {string} topic - nombre del evento/tópico (ej: 'entrada_emitida')
     * @param {object} payload
     */
    async publish(topic, payload) {
        console.log(`[mockBroker] publish -> ${topic}`, payload);
        this.emitter.emit(topic, payload);
        return { publicado: true, topic };
    }

    async publishToExchange(exchange, topic, payload) {
        const routedTopic = `${exchange}:${topic}`;
        console.log(`[mockBroker] publish -> ${routedTopic}`, payload);
        this.emitter.emit(routedTopic, payload);
        return { publicado: true, exchange, topic };
    }

    /**
     * Se suscribe a un tópico.
     * @param {string} topic
     * @param {(payload: object) => Promise<void>} handler
     */
    subscribe(topic, handler) {
        console.log(`[mockBroker] suscrito a -> ${topic}`);
        this.emitter.on(topic, async (payload) => {
            try {
                await handler(payload);
            } catch (error) {
                console.error(`[mockBroker] error procesando "${topic}":`, error.message);
            }
        });
    }

    subscribeToExchange(exchange, topic, handler) {
        const routedTopic = `${exchange}:${topic}`;
        console.log(`[mockBroker] suscrito a -> ${routedTopic}`);
        this.emitter.on(routedTopic, async (payload) => {
            try {
                await handler(payload);
            } catch (error) {
                console.error(`[mockBroker] error procesando "${routedTopic}":`, error.message);
            }
        });
    }
}

module.exports = new MockBroker();
