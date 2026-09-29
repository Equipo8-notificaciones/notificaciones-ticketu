//Selecciona la implementación del broker según BROKER_MODE.
const modo = process.env.BROKER_MODE || 'mock';

const broker = modo === 'rabbitmq'
    ? require('./rabbitmqBroker')
    : require('./mockBroker');

module.exports = broker;
