//Aquí se recibirán eventos de otros microservicios mediante RabbitMQ

function procesarEvento(evento) {
    if (!evento || !evento.tipo) {
        throw new Error('El evento debe incluir tipo');
    }

    return { recibido: true, tipo: evento.tipo };
}

module.exports = { procesarEvento };
