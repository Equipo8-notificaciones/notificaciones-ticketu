const swaggerJsdoc = require('swagger-jsdoc');
const { PORT } = require('./env');

const TIPOS = [
    'COMPRA', 'RECORDATORIO', 'RECORDATORIO_24H', 'RECORDATORIO_30M',
    'INICIO_EVENTO', 'EVENTO_CAMBIO', 'CAMBIO_EVENTO', 'CANCELACION_EVENTO'
];

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Notificaciones - TITEC',
            version: '1.2.0',
            description: 'API del módulo de Notificaciones integrado con Supabase, AUTH, Entradas y Panel.'
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
                AuthResultadoCorreo: {
                    type: 'object',
                    description: 'Resultado publicado por Notificaciones en notificaciones.events con routing key correo_auth.',
                    required: ['email_destino', 'estado_envio'],
                    properties: {
                        email_destino: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
                        estado_envio: { type: 'string', enum: ['exitoso', 'error'] },
                        error_envio: { type: 'string' }
                    }
                },
                EntradasConfirmacionEnvio: {
                    type: 'object',
                    description: 'Confirmación publicada por Notificaciones en notificaciones.events con routing key notificaciones.confirmacion_envio cuando se recibe entradas_emitidas.',
                    required: ['estado'],
                    properties: {
                        estado: { type: 'string', enum: ['en_cola'], example: 'en_cola' }
                    }
                },
                PanelResultadoNotificacion: {
                    type: 'object',
                    required: ['id_evento', 'nuevo_estado', 'usuarios_notificados', 'usuarios_faltantes', 'fecha_envio'],
                    description: 'Resultado del proceso de notificación de un evento, enviado al organizador.',
                    properties: {
                        id_evento: { type: 'string', example: 'evt-001' },
                        id_usuario: { type: 'string', example: 'usr-001' },
                        nuevo_estado: { type: 'string', enum: ['exito', 'error'] },
                        usuarios_notificados: { type: 'integer', example: 150 },
                        usuarios_faltantes: { type: 'integer', example: 0 },
                        fecha_envio: { type: 'string', format: 'date-time', example: '2026-10-01T16:30:00.000Z' }
                    }
                },
                EventoActualizadoPanel: {
                    type: 'object',
                    required: ['id_evento', 'id_usuario', 'nuevo_estado'],
                    properties: {
                        id_evento: { type: 'string', example: 'evt-001' },
                        id_usuario: { type: 'string', example: 'usr-001' },
                        nuevo_estado: { type: 'string', enum: ['cancelado'] }
                    }
                },
                EventoReprogramadoPanel: {
                    type: 'object',
                    required: ['id_evento', 'id_usuario', 'nuevo_estado', 'fecha_cambio', 'hora_cambio'],
                    properties: {
                        id_evento: { type: 'string', example: 'evt-001' },
                        id_usuario: { type: 'string', example: 'usr-001' },
                        nuevo_estado: { type: 'string', enum: ['publicado'] },
                        fecha_cambio: { type: 'string', format: 'date', example: '2026-09-13' },
                        hora_cambio: { type: 'string', example: '00:00:00' }
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
