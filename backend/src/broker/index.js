/**
 * Punto de acceso a la implementación del broker de mensajería.
 *
 * BROKER_MODE=rabbitmq -> utiliza RabbitMQ como broker real.
 * BROKER_MODE=mock     -> utiliza un broker en memoria para desarrollo local.
 *
 * La selección de la implementación se realiza mediante la variable de entorno
 * BROKER_MODE, permitiendo que los handlers utilicen una interfaz común de
 * publicación y suscripción sin depender de una implementación específica.
 */
const modo = process.env.BROKER_MODE || 'mock';

const broker = modo === 'rabbitmq'
    ? require('./rabbitmqBroker')
    : require('./mockBroker');

module.exports = broker;
