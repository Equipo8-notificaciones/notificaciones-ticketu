const swaggerJsdoc = require('swagger-jsdoc');
const { PORT } = require('./env');
/**
 * Configuración de Swagger/OpenAPI para los servicios del módulo de Notificaciones.
 *
 * Documenta los servicios HTTP propios y los contratos de eventos asíncronos
 * publicados mediante broker.
 */
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Notificaciones - TITEC',
            version: '1.0.0',
            description:
                'Servicios propios del módulo de Notificaciones: creación, consulta, ' +
                'marcado como leída/leídas y eliminación de notificaciones del centro de ' +
                'notificaciones del usuario. También se documentan como referencia los ' +
                'contratos de eventos asíncronos que Notificaciones publica hacia Auth y Panel mediante broker.'
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Servidor local'
            }
        ],
        components: {
            schemas: {
                Notificacion: {
                    type: 'object',
                    properties: {
                        id_notificacion: { type: 'string', example: 'NOT-1732550000000-4821' },
                        usuario_id: { type: 'string', example: 'USR-123' },
                        tipo: {
                            type: 'string',
                            enum: ['COMPRA', 'RECORDATORIO', 'EVENTO_CAMBIO', 'RECUPERACION_PASSWORD']
                        },
                        titulo: { type: 'string', example: 'Tienes 2 entradas para Concierto Tini' },
                        mensaje: { type: 'string', example: 'Tu compra fue confirmada.' },
                        datos: { type: 'object', additionalProperties: true },
                        fecha_emision: { type: 'string', format: 'date-time' },
                        estado: { type: 'string', enum: ['NO_LEIDA', 'LEIDA', 'ELIMINADA'] },
                        fecha_lectura: { type: 'string', format: 'date-time', nullable: true },
                        fecha_eliminacion: { type: 'string', format: 'date-time', nullable: true },
                        intentos_envio: { type: 'integer', example: 0 },
                        error_envio: { type: 'string', nullable: true }
                    }
                },
                NuevaNotificacion: {
                    type: 'object',
                    required: ['usuarioId', 'tipo', 'titulo', 'mensaje'],
                    properties: {
                        usuarioId: { type: 'string', example: 'USR-123' },
                        tipo: {
                            type: 'string',
                            enum: ['COMPRA', 'RECORDATORIO', 'EVENTO_CAMBIO', 'RECUPERACION_PASSWORD']
                        },
                        titulo: { type: 'string', example: 'Tienes 2 entradas para Concierto Tini' },
                        mensaje: { type: 'string', example: 'Tu compra fue confirmada.' },
                        datos: { type: 'object', additionalProperties: true }
                    }
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
                    description:
                        'Contrato del evento asíncrono publicado por Notificaciones hacia Auth mediante broker en el tópico notificaciones.auth.resultado. No constituye un endpoint HTTP.',
                    properties: {
                        email_destino: {
                            type: 'string',
                            format: 'email',
                            example: 'usuario@ejemplo.com'
                        },
                        estado_envio: {
                            type: 'string',
                            enum: ['exitoso', 'error'],
                            example: 'exitoso'
                        },
                        error_envio: {
                            type: 'string',
                            nullable: true,
                            example: 'No fue posible enviar el correo'
                        }
                    }
                },
                PanelResultadoNotificacion: {
                    type: 'object',
                    description:
                        'Contrato del evento asíncrono publicado por Notificaciones hacia Panel Organizador mediante broker en el tópico notificaciones.panel.resultado. No constituye un endpoint HTTP.',
                    properties: {
                        id_evento: {
                            type: 'integer',
                            example: 123
                        },
                        estado_envio: {
                            type: 'string',
                            enum: ['exitoso', 'error'],
                            example: 'exitoso'
                        },
                        usuarios_notificados: {
                            type: 'integer',
                            example: 15
                        },
                        usuarios_faltantes: {
                            type: 'integer',
                            example: 2
                        },
                        fecha_envio: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-09-25T18:30:00.000Z'
                        },
                        mensaje: {
                            type: 'string',
                            example: 'Envío realizado correctamente'
                        }
                    }
                }
            }
        }
    },
    // Swagger-jsdoc lee los comentarios @swagger de estos archivos.
    apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);