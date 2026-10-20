const { Notificacion, EstadosNotificacion, TiposNotificacion, CanalesNotificacion } = require('../models/Notificacion');
const repo = require('../repositories/notificacionRepository');

class NotificacionService {
    async crearNotificacion(datos) {
        const usuarioId = datos?.usuarioId ?? datos?.id_usuario ?? datos?.Id_usuario;
        const tipo = datos?.tipo ?? datos?.titulo;
        if (usuarioId === undefined || usuarioId === null || String(usuarioId).trim() === '' || !tipo || !datos?.mensaje) {
            throw new Error('id_usuario, tipo y mensaje son obligatorios');
        }
        if (!Object.values(TiposNotificacion).includes(tipo)) {
            throw new Error(`Tipo de notificación inválido: ${tipo}`);
        }
        const canal = datos.canal || 'APP';
        if (!Object.values(CanalesNotificacion).includes(canal)) {
            throw new Error(`Canal de notificación inválido: ${canal}`);
        }
        return repo.save(new Notificacion({
            ...datos,
            usuarioId: String(usuarioId).trim(),
            tipo,
            canal,
            estado: datos.estado || EstadosNotificacion.NO_LEIDA
        }));
    }

    async obtenerCentro(usuarioId) {
        if (!usuarioId) throw new Error('usuarioId es obligatorio');
        return repo.findByUsuario(String(usuarioId));
    }

    async obtenerPorId(id) {
        const notificacion = await repo.findById(id);
        if (!notificacion) throw new Error('Notificación no encontrada');
        return notificacion;
    }

    async obtenerEnvios(id) {
        await this.obtenerPorId(id);
        return repo.findEnviosByNotificacion(id);
    }

    async marcarComoLeida(id) {
        const notificacion = await this.obtenerPorId(id);
        notificacion.estado_lectura = 'LEIDA';
        notificacion.estado = 'LEIDA';
        return repo.update(notificacion);
    }

    async marcarTodasComoLeidas(usuarioId) {
        const notificaciones = await this.obtenerCentro(usuarioId);
        const actualizadas = [];
        for (const n of notificaciones) {
            if (n.estado_lectura === 'NO_LEIDA') actualizadas.push(await this.marcarComoLeida(n.id_notificacion));
        }
        return actualizadas;
    }

    async eliminar(id) {
        return repo.softDelete(id);
    }

/*    async eliminarVarias(ids) {
        if (!Array.isArray(ids) || !ids.length) throw new Error('Debe indicar al menos un ID');
        const resultados = [];
        for (const id of ids) resultados.push(await this.eliminar(id));
        return resultados;
    }
*/

    // Cada intento se persiste como PENDIENTE y luego se cierra como ENVIADO o ERROR.
    // De este modo queda un registro independiente por cada reintento.
    async enviarConReintentos(id, canal, funcionEnvio, maxIntentos = 3) {
        if (typeof funcionEnvio !== 'function') throw new Error('Debe indicar la función de envío');
        const notificacion = await this.obtenerPorId(id);
        const canalFinal = canal || notificacion.canal || 'APP';
        let ultimoError;

        for (let intento = 1; intento <= maxIntentos; intento++) {
            const registro = await repo.crearIntentoEnvio(id, intento);
            try {
                const resultado = await funcionEnvio(notificacion);
                if (resultado?.enviado === false) {
                    throw new Error(resultado.error || 'El canal indicó que el mensaje no fue enviado');
                }
                await repo.finalizarIntentoEnvio(registro.id_envio, 'ENVIADO', null);
                return { notificacion, resultado, canal: canalFinal, intentos: intento };
            } catch (error) {
                ultimoError = error;
                await repo.finalizarIntentoEnvio(registro.id_envio, 'ERROR', error.message || String(error));
            }
        }

        const errorFinal = new Error(`Falló el envío después de ${maxIntentos} intentos: ${ultimoError?.message || 'error desconocido'}`);
        errorFinal.cause = ultimoError;
        errorFinal.intentos = maxIntentos;
        throw errorFinal;
    }
}

module.exports = new NotificacionService();
