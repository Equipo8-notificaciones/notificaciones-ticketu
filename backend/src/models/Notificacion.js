const EstadosNotificacion = Object.freeze({
    NO_LEIDA: 'NO_LEIDA',
    LEIDA: 'LEIDA',
    ELIMINADA: 'ELIMINADA'
});

const TiposNotificacion = Object.freeze({
    COMPRA: 'COMPRA',
    RECORDATORIO: 'RECORDATORIO',
    RECORDATORIO_24H: 'RECORDATORIO_24H',
    RECORDATORIO_30M: 'RECORDATORIO_30M',
    INICIO_EVENTO: 'INICIO_EVENTO',
    EVENTO_CAMBIO: 'EVENTO_CAMBIO',
    CAMBIO_EVENTO: 'CAMBIO_EVENTO',
    CANCELACION_EVENTO: 'CANCELACION_EVENTO',
});

const CanalesNotificacion = Object.freeze({ APP: 'APP', EMAIL: 'EMAIL' });

class Notificacion {
    constructor({
        id,
        id_notificacion,
        usuarioId,
        id_usuario,
        tipo,
        titulo,
        mensaje,
        datos = {},
        estado = EstadosNotificacion.NO_LEIDA,
        estadoLectura,
        fechaEliminacion = null,
        canal = CanalesNotificacion.APP,
        created_at
    }) {
        this.id_notificacion = id_notificacion ?? id;
        this.id_usuario = String(id_usuario ?? usuarioId ?? '');
        this.usuario_id = this.id_usuario;
        this.tipo = tipo || titulo;
        this.titulo = this.tipo; // compatibilidad del cliente anterior; no es una columna SQL
        this.mensaje = mensaje;
        this.datos = datos;
        this.estado_lectura = estadoLectura || estado;
        this.estado = this.estado_lectura;
        this.fecha_eliminacion = fechaEliminacion;
        this.canal = canal;
        this.created_at = created_at || new Date().toISOString();
        this.fecha_emision = this.created_at;
    }

    marcarComoLeida() {
        this.estado_lectura = 'LEIDA';
        this.estado = 'LEIDA';
        return this;
    }

    eliminar() {
        this.estado_lectura = 'ELIMINADA';
        this.estado = 'ELIMINADA';
        this.fecha_eliminacion = new Date().toISOString();
        return this;
    }
}

module.exports = { Notificacion, EstadosNotificacion, TiposNotificacion, CanalesNotificacion };
