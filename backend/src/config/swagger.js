const swaggerJsdoc = require('swagger-jsdoc');
const { PORT } = require('./env');


//Configuración de Swagger/OpenAPI para los servicios de Notificaciones
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Notificaciones - TITEC',
            version: '1.0.0',
            description:
                'Servicios propios de Notificaciones y contratos de eventos asíncronos gestionados mediante broker.'
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

                EntradaEmitidaEvento: {
                    type: 'object',
                    description:
                        'Evento asíncrono "entrada_emitida" enviado por Entradas a Notificaciones mediante broker. No es un endpoint HTTP.',
                    properties: {
                        tipo: { type: 'string', example: 'entrada_emitida' },
                        id_usuario: { type: 'string', example: 'USR-123' },
                        id_evento: { type: 'integer', example: 45 },
                        nombre_evento: { type: 'string', example: 'Concierto Tini' },
                        fecha_evento: { type: 'string', format: 'date-time' },
                        cantidad_entradas: { type: 'integer', example: 2 },
                        fecha_emision: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            description: 'Campo opcional según el contrato.'
                        }
                    }
                },

                RecuperacionCuentaEvento: {
                    type: 'object',
                    description:
                        'Evento asíncrono "recuperacion_cuenta" enviado por Auth a Notificaciones mediante broker.',
                    properties: {
                        tipo: { type: 'string', example: 'recuperacion_cuenta' },
                        id_usuario: { type: 'string', example: 'USR-123' },
                        email_destino: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
                        url: { type: 'string', example: 'https://app.titec.cl/reset-password?token=...' },
                        rol: {
                            type: 'string',
                            nullable: true,
                            description: 'Opcional, según corresponda en el contrato actual.'
                        }
                    }
                },

                CuentaStaffEvento: {
                    type: 'object',
                    description:
                        'Evento asíncrono "cuenta_staff" enviado por Auth a Notificaciones mediante broker.',
                    properties: {
                        tipo: { type: 'string', example: 'cuenta_staff' },
                        id_usuario: { type: 'string', example: 'USR-123' },
                        email_destino: { type: 'string', format: 'email', example: 'staff@ejemplo.com' },
                        url: { type: 'string', example: 'https://app.titec.cl/activar-cuenta?token=...' },
                        rol: {
                            type: 'string',
                            nullable: true,
                            description: 'Opcional, según corresponda en el contrato actual.'
                        }
                    }
                },

                PanelEventoActualizadoEvento: {
                    type: 'object',
                    description:
                        'Evento asíncrono "panel.evento.actualizado" enviado por Panel a Notificaciones mediante broker.',
                    properties: {
                        tipo: { type: 'string', example: 'evento_actualizado' },
                        id_evento: { type: 'integer', example: 45 },
                        nuevo_estado: {
                            type: 'string',
                            enum: ['cancelado', 'reprogramado', 'finalizado', 'borrador'],
                            example: 'cancelado'
                        },
                        fecha_cambio: { type: 'string', format: 'date-time', nullable: true }
                    }
                },

                AuthResultadoNotificacion: {
                    type: 'object',
                    description:
                        'Resultado de envío publicado por Notificaciones hacia Auth mediante broker.',
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
                        'Resultado de envío publicado por Notificaciones hacia Panel mediante broker.',
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