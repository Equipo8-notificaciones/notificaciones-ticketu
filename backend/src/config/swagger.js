const swaggerJsdoc = require('swagger-jsdoc');
const { PORT } = require('./env');

const TIPOS = [
    'COMPRA', 'RECORDATORIO', 'RECORDATORIO_24H', 'RECORDATORIO_30M',
    'INICIO_EVENTO', 'EVENTO_CAMBIO', 'CAMBIO_EVENTO', 'CANCELACION_EVENTO',
    'RECUPERACION_PASSWORD', 'CREACION_STAFF'
];

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Notificaciones - TITEC',
            version: '1.1.0',
            description: 'API del módulo de Notificaciones integrado con Supabase, AUTH, Entradas y PANEL.'
        },
        servers: [{ url: `http://localhost:${PORT}`, description: 'Servidor local' }],
        components: {
            schemas: {
                Notificacion: {
                    type: 'object',
                    properties: {
                        id_notificacion: { type: 'integer', format: 'int64', example: 1 },
                        id_usuario: { type: 'string', example: 'usr123' },
                        tipo: { type: 'string', enum: TIPOS },
                        mensaje: { type: 'string', example: 'Tu compra fue confirmada.' },
                        datos: { type: 'object', additionalProperties: true },
                        estado_lectura: { type: 'string', enum: ['NO_LEIDA', 'LEIDA', 'ELIMINADA'] },
                        fecha_eliminacion: { type: 'string', format: 'date-time', nullable: true },
                        canal: { type: 'string', enum: ['APP', 'EMAIL'] },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                NuevaNotificacion: {
                    type: 'object',
                    required: ['tipo', 'mensaje'],
                    properties: {
                        usuarioId: { type: 'string', example: 'usr123' },
                        id_usuario: { type: 'string', example: 'usr123' },
                        tipo: { type: 'string', enum: TIPOS },
                        mensaje: { type: 'string', example: 'Tu compra fue confirmada.' },
                        datos: { type: 'object', additionalProperties: true },
                        canal: { type: 'string', enum: ['APP', 'EMAIL'], default: 'APP' }
                    },
                    description: 'Debe enviarse usuarioId o id_usuario, además de tipo y mensaje.'
                },
                ErrorRespuesta: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        detalle: { type: 'string' }
                    }
                },
                AuthResultadoNotificacion: {
                    type: 'object',
                    description: 'Resultado publicado por Notificaciones hacia AUTH en notificaciones.auth.resultado.',
                    properties: {
                        email_destino: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
                        gmail_destino: { type: 'string', format: 'email', nullable: true },
                        estado_envio: { type: 'string', enum: ['exitoso', 'error'] },
                        error_envio: { type: 'string', nullable: true }
                    }
                },
                PanelResultadoNotificacion: {
                    type: 'object',
                    description: 'Resumen de cambios de evento; se publica en notificaciones.panel.resultado y notificaciones.auth.resultado.',
                    properties: {
                        tipo_respuesta: { type: 'string', example: 'evento_actualizado' },
                        id_evento: { type: 'string', example: 'ev23' },
                        titulo: { type: 'string', example: 'Evento actualizado' },
                        mensaje: { type: 'string', example: 'El estado del evento ha sido actualizado correctamente.' },
                        estado_envio: { type: 'string', enum: ['exitoso', 'parcial', 'error'] },
                        usuarios_notificados: { type: 'integer', example: 150 },
                        usuarios_no_notificados: { type: 'integer', example: 0 },
                        fecha_envio: { type: 'string', example: '1 de octubre de 2026, 13:30' },
                        fecha_envio_iso: { type: 'string', format: 'date-time' }
                    }
                },
                ResultadoEnvio: {
                    type: 'object',
                    properties: {
                        id_envio: { type: 'integer', format: 'int64' },
                        id_notificacion: { type: 'integer', format: 'int64' },
                        estado_envio: { type: 'string', enum: ['PENDIENTE', 'ENVIADO', 'ERROR'] },
                        intento: { type: 'integer' },
                        error: { type: 'string', nullable: true },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);
