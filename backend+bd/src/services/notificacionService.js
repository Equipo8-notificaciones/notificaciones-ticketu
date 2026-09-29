const { Notificacion, EstadosNotificacion, TiposNotificacion } = require('../models/Notificacion');
const notificacionRepository = require('../repositories/notificacionRepository');

class NotificacionService {
    async crearNotificacion(datos) {
        if (!datos.usuarioId || !datos.tipo || !datos.titulo || !datos.mensaje) {
            throw new Error('usuarioId, tipo, titulo y mensaje son obligatorios');
        }

        if (!Object.values(TiposNotificacion).includes(datos.tipo)) {
            throw new Error(`Tipo de notificación inválido: ${datos.tipo}`);
        }

        const id = datos.id || `NOT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        if (await notificacionRepository.findById(id)) {
            throw new Error('Ya existe una notificación con ese ID');
        }

        const notificacion = new Notificacion({ ...datos, id });
        return notificacionRepository.save(notificacion);
    }

    async obtenerCentro(usuarioId) {
        if (!usuarioId) throw new Error('usuarioId es obligatorio');
        return notificacionRepository.findByUsuario(usuarioId);
    }

    async obtenerPorId(id) {
        const notificacion = await notificacionRepository.findById(id);
        if (!notificacion) throw new Error('Notificación no encontrada');
        return notificacion;
    }

    async marcarComoLeida(id) {
        const notificacion = await this.obtenerPorId(id);
        const instancia = new Notificacion({
            id: notificacion.id_notificacion,
            usuarioId: notificacion.usuario_id,
            tipo: notificacion.tipo,
            titulo: notificacion.titulo,
            mensaje: notificacion.mensaje,
            datos: notificacion.datos,
            fechaEmision: notificacion.fecha_emision,
            estado: notificacion.estado,
            fechaLectura: notificacion.fecha_lectura,
            fechaEliminacion: notificacion.fecha_eliminacion,
            intentosEnvio: notificacion.intentos_envio,
            errorEnvio: notificacion.error_envio
        });

        instancia.marcarComoLeida();
        return notificacionRepository.update(instancia);
    }

    async marcarTodasComoLeidas(usuarioId) {
        if (!usuarioId) throw new Error('usuarioId es obligatorio');

        const notificaciones = await notificacionRepository.findByUsuario(usuarioId);
        const actualizadas = [];

        for (const notificacion of notificaciones) {
            if (notificacion.estado !== EstadosNotificacion.NO_LEIDA) continue;

            const instancia = this.aInstancia(notificacion);
            instancia.marcarComoLeida();
            actualizadas.push(await notificacionRepository.update(instancia));
        }

        return actualizadas;
    }

    async eliminar(id) {
        const notificacion = await this.obtenerPorId(id);
        const instancia = this.aInstancia(notificacion);
        instancia.eliminar();
        return notificacionRepository.update(instancia);
    }

    async eliminarVarias(ids) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('Debe indicar al menos un ID de notificación');
        }
        const resultado = [];
        for (const id of ids) resultado.push(await this.eliminar(id));
        return resultado;
    }

    async registrarFalloEnvio(id, error) {
        const notificacion = await this.obtenerPorId(id);
        const instancia = this.aInstancia(notificacion);
        instancia.intentos_envio += 1;
        instancia.error_envio = error || 'Error desconocido';
        return notificacionRepository.update(instancia);
    }

    async enviarConReintentos(id, enviarFuncion, maxReintentos = 3) {
        const notificacion = await this.obtenerPorId(id);
        let ultimoError;

        for (let intento = 1; intento <= maxReintentos; intento++) {
            try {
                await enviarFuncion(notificacion);
                const instancia = this.aInstancia(notificacion);
                instancia.intentos_envio = intento;
                instancia.error_envio = null;
                return notificacionRepository.update(instancia);
            } catch (error) {
                ultimoError = error;
                const instancia = this.aInstancia(notificacion);
                instancia.intentos_envio = intento;
                instancia.error_envio = error.message;
                await notificacionRepository.update(instancia);
                notificacion.intentos_envio = intento;
                notificacion.error_envio = error.message;
            }
        }

        throw new Error(`Falló el envío después de ${maxReintentos} intentos: ${ultimoError.message}`);
    }

    aInstancia(notificacion) {
        return new Notificacion({
            id: notificacion.id_notificacion,
            usuarioId: notificacion.usuario_id,
            tipo: notificacion.tipo,
            titulo: notificacion.titulo,
            mensaje: notificacion.mensaje,
            datos: notificacion.datos,
            fechaEmision: notificacion.fecha_emision,
            estado: notificacion.estado,
            fechaLectura: notificacion.fecha_lectura,
            fechaEliminacion: notificacion.fecha_eliminacion,
            intentosEnvio: notificacion.intentos_envio,
            errorEnvio: notificacion.error_envio
        });
    }
}

module.exports = new NotificacionService();
