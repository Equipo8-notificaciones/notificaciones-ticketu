const DIA_EN_MILISEGUNDOS = 24 * 60 * 60 * 1000;
const MAX_DELAY = 2_147_000_000;

function parsearFechaEvento(fechaEvento, horaEvento) {
    const fechaMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fechaEvento));
    const horaMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(horaEvento));

    if (!fechaMatch || !horaMatch) {
        throw new Error('La fecha debe usar AAAA-MM-DD y la hora HH:mm.');
    }

    const [, anio, mes, dia] = fechaMatch;
    const [, horas, minutos, segundos = '0'] = horaMatch;
    const fecha = new Date(
        Number(anio), Number(mes) - 1, Number(dia),
        Number(horas), Number(minutos), Number(segundos)
    );

    if (
        fecha.getFullYear() !== Number(anio) ||
        fecha.getMonth() !== Number(mes) - 1 ||
        fecha.getDate() !== Number(dia) ||
        fecha.getHours() !== Number(horas) ||
        fecha.getMinutes() !== Number(minutos) ||
        fecha.getSeconds() !== Number(segundos)
    ) {
        throw new Error('La fecha u hora del evento no es válida.');
    }

    return fecha;
}

function planificarRecordatorio(fechaEvento, horaEvento, ahora = new Date()) {
    const inicioEvento = parsearFechaEvento(fechaEvento, horaEvento);
    const fechaEnvio = new Date(inicioEvento.getTime() - DIA_EN_MILISEGUNDOS);

    return {
        fechaEvento: inicioEvento,
        fechaEnvio,
        enviarAhora: fechaEnvio.getTime() <= ahora.getTime()
    };
}

function formatearFechaEvento(fechaEvento) {
    const texto = String(fechaEvento);
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
    if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;

    const diaMesAnioMatch = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(texto);
    if (diaMesAnioMatch) return `${diaMesAnioMatch[1]}-${diaMesAnioMatch[2]}-${diaMesAnioMatch[3]}`;

    return texto;
}

function crearTrabajoRecordatorio(datos) {
    return { tipo: 'RECORDATORIO_24H', datos };
}

function programarTrabajoRecordatorio(fechaEnvio, ejecutar) {
    const ejecutarCuandoCorresponda = () => {
        const delay = fechaEnvio.getTime() - Date.now();
        if (delay > 0) {
            const timer = setTimeout(ejecutarCuandoCorresponda, Math.min(delay, MAX_DELAY));
            timer.unref?.();
            return;
        }

        Promise.resolve()
            .then(ejecutar)
            .catch((error) => console.error('[notificacionJobs] falló recordatorio programado:', error.message));
    };

    ejecutarCuandoCorresponda();
    return { tipo: 'RECORDATORIO_24H', fecha_ejecucion: fechaEnvio.toISOString() };
}

function crearTrabajoReintento(datos) {
    return { tipo: 'REINTENTO_ENVIO', datos };
}

module.exports = {
    crearTrabajoRecordatorio,
    programarTrabajoRecordatorio,
    planificarRecordatorio,
    formatearFechaEvento,
    crearTrabajoReintento
};
