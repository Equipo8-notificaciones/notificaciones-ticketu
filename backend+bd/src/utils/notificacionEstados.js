const EstadosNotificacion = Object.freeze({
    NO_LEIDA: 'NO_LEIDA',
    LEIDA: 'LEIDA',
    ELIMINADA: 'ELIMINADA'
});

const transiciones = Object.freeze({
    [EstadosNotificacion.NO_LEIDA]: Object.freeze([
        EstadosNotificacion.LEIDA,
        EstadosNotificacion.ELIMINADA
    ]),
    [EstadosNotificacion.LEIDA]: Object.freeze([
        EstadosNotificacion.ELIMINADA
    ]),
    [EstadosNotificacion.ELIMINADA]: Object.freeze([])
});

function puedeTransicionar(estadoActual, nuevoEstado) {
    return transiciones[estadoActual]?.includes(nuevoEstado) ?? false;
}

module.exports = { EstadosNotificacion, transiciones, puedeTransicionar };
