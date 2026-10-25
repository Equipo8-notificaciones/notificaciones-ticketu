const { EventEmitter } = require('events');

class MockBroker {
    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50);
    }

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

    subscribe(topic, handler) {
        console.log(`[mockBroker] suscrito a -> ${topic}`);
        this.emitter.on(topic, async payload => {
            try { await handler(payload); }
            catch (error) { console.error(`[mockBroker] error procesando "${topic}":`, error.message); }
        });
    }

    subscribeToExchange(exchange, topic, handler) {
        const routedTopic = `${exchange}:${topic}`;
        console.log(`[mockBroker] suscrito a -> ${routedTopic}`);
        this.emitter.on(routedTopic, async payload => {
            try { await handler(payload); }
            catch (error) { console.error(`[mockBroker] error procesando "${routedTopic}":`, error.message); }
        });
    }
}

module.exports = new MockBroker();
