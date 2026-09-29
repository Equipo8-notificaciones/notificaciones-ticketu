const { EventEmitter } = require('events');

//Broker simulado en memoria para desarrollo local
class MockBroker {
    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50);
    }

    //Publica un mensaje en un tópico
    async publish(topic, payload) {
        console.log(`[mockBroker] publish -> ${topic}`, payload);
        this.emitter.emit(topic, payload);
        return { publicado: true, topic };
    }

    //Se suscribe a un tópico
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
}

module.exports = new MockBroker();
