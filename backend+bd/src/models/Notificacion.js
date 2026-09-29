const { EstadosNotificacion, puedeTransicionar } = require('../utils/notificacionEstados');

const TiposNotificacion = Object.freeze({
    COMPRA: 'COMPRA',
    RECORDATORIO: 'RECORDATORIO',
    EVENTO_CAMBIO: 'EVENTO_CAMBIO',
    RECUPERACION_PASSWORD: 'RECUPERACION_PASSWORD'
});

class Notificacion {
    constructor({
        id,
        usuarioId,
        tipo,
        titulo,
        mensaje,
        datos = {},
        fechaEmision = new Date().toISOString(),
        estado = EstadosNotificacion.NO_LEIDA,
        fechaLectura = null,
        fechaEliminacion = null,
        intentosEnvio = 0,
        errorEnvio = null
    }) {
        this.id_notificacion = id;
        this.usuario_id = usuarioId;
        this.tipo = tipo;
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.datos = datos;
        this.fecha_emision = fechaEmision;
        this.estado = estado;
        this.fecha_lectura = fechaLectura;
        this.fecha_eliminacion = fechaEliminacion;
        this.intentos_envio = intentosEnvio;
        this.error_envio = errorEnvio;
    }

    marcarComoLeida() {
        if (!puedeTransicionar(this.estado, EstadosNotificacion.LEIDA)) {
            if (this.estado === EstadosNotificacion.LEIDA) return this;
            throw new Error(`No se puede cambiar de ${this.estado} a ${EstadosNotificacion.LEIDA}`);
        }

        this.estado = EstadosNotificacion.LEIDA;
        this.fecha_lectura = new Date().toISOString();
        return this;
    }

    eliminar() {
        if (this.estado === EstadosNotificacion.ELIMINADA) return this;

        if (!puedeTransicionar(this.estado, EstadosNotificacion.ELIMINADA)) {
            throw new Error(`No se puede cambiar de ${this.estado} a ${EstadosNotificacion.ELIMINADA}`);
        }

        this.estado = EstadosNotificacion.ELIMINADA;
        this.fecha_eliminacion = new Date().toISOString();
        return this;
    }
}

module.exports = { Notificacion, EstadosNotificacion, TiposNotificacion };
