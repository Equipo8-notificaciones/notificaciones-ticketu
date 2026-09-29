//Define los trabajos de recordatorio y reintento

function crearTrabajoRecordatorio(datos) {
    return { tipo: 'RECORDATORIO_24H', datos };
}

function crearTrabajoReintento(datos) {
    return { tipo: 'REINTENTO_ENVIO', datos };
}

module.exports = { crearTrabajoRecordatorio, crearTrabajoReintento };
