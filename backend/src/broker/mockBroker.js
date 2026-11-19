const { EventEmitter } = require('events');

class MockBroker {
    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50);
    }

    async publish(exchange, topic, payload, propiedades) {
        return this.publishToExchange(exchange, topic, payload, propiedades);
    }

    async publishToExchange(exchange, topic, payload, propiedades) {
        const routedTopic = `${exchange}:${topic}`;
        console.log(`[mockBroker] publish -> ${routedTopic}`, payload);
        this.emitter.emit(routedTopic, payload, propiedades);
        return { publicado: true, exchange, topic };
    }

    subscribe(exchange, topic, handler) {
        this.subscribeToExchange(exchange, topic, handler);
    }

    subscribeToExchange(exchange, topic, handler) {
        const routedTopic = `${exchange}:${topic}`;
        console.log(`[mockBroker] suscrito a -> ${routedTopic}`);
        this.emitter.on(routedTopic, async (payload, propiedades) => {
            try { await handler(payload, propiedades); }
            catch (error) { console.error(`[mockBroker] error procesando "${routedTopic}":`, error.message); }
        });
    }
}

module.exports = new MockBroker();
