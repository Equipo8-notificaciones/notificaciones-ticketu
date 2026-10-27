const express = require('express');
const router = express.Router();
const notificacionService = require('../services/notificacionService');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * /api/notificaciones:
 *   post:
 *     summary: Crear una notificación
 *     description: Crea una notificación para el usuario autenticado; se ignora cualquier ID de usuario del body.
 *     tags: [Notificaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevaNotificacion'
 *     responses:
 *       201:
 *         description: Notificación creada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notificacion'
 *       400:
 *         description: Datos inválidos o faltantes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.post('/', async (req, res) => {
    try {
        const notificacion = await notificacionService.crearNotificacion({
            ...req.body,
            usuarioId: req.user.id_usuario
        });
        res.status(201).json(notificacion);
    } catch (error) {
        res.status(400).json({ error: 'Error al crear notificación', detalle: error.message });
    }
});

/**
 * @swagger
 * /api/notificaciones:
 *   get:
 *     summary: Obtener el centro de notificaciones de un usuario
 *     description: Lista las notificaciones no eliminadas de un usuario, ordenadas de la más reciente a la más antigua.
 *     tags: [Notificaciones]
 *     responses:
 *       200:
 *         description: Lista de notificaciones del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notificacion'
 */
router.get('/', async (req, res) => {
    try {
        const notificaciones = await notificacionService.obtenerCentro(req.user.id_usuario);
        res.json(notificaciones);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/notificaciones/eventos:
 *   get:
 *     summary: Obtener las notificaciones del usuario para el front
 *     description: Alias del centro de notificaciones, ordenado de la más reciente a la más antigua.
 *     tags: [Notificaciones]
 *     responses:
 *       200:
 *         description: Lista de notificaciones del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notificacion'
 */
router.get('/eventos', async (req, res) => {
    try {
        const notificaciones = await notificacionService.obtenerCentro(req.user.id_usuario);
        res.json(notificaciones);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/notificaciones/{id}:
 *   get:
 *     summary: Obtener una notificación por ID
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la notificación (id_notificacion).
 *     responses:
 *       200:
 *         description: Notificación encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notificacion'
 *       404:
 *         description: No existe una notificación con ese ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
/**
 * @swagger
 * /api/notificaciones/{id}/envios:
 *   get:
 *     summary: Consultar los intentos de envío de una notificación
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Historial de intentos con estado, número de intento y error si existe.
 *       404:
 *         description: Notificación no encontrada.
 */
router.get('/:id/envios', async (req, res) => {
    try {
        res.json(await notificacionService.obtenerEnviosDeUsuario(req.params.id, req.user.id_usuario));
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        res.json(await notificacionService.obtenerNotificacionDeUsuario(req.params.id, req.user.id_usuario));
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/notificaciones/{id}/leida:
 *   post:
 *     summary: Marcar una notificación como leída
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la notificación (id_notificacion).
 *     responses:
 *       200:
 *         description: Notificación actualizada con estado LEIDA.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notificacion'
 *       400:
 *         description: La notificación no existe o no puede pasar a LEIDA desde su estado actual.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.post('/:id/leida', async (req, res) => {
    try {
        res.json(await notificacionService.marcarComoLeida(req.params.id, req.user.id_usuario));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/notificaciones/marcar-todas-leidas:
 *   post:
 *     summary: Marcar todas las notificaciones de un usuario como leídas
 *     tags: [Notificaciones]
 *     responses:
 *       200:
 *         description: Notificaciones que fueron actualizadas a estado LEIDA.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notificacion'
 */
router.post('/marcar-todas-leidas', async (req, res) => {
    try {
        res.json(await notificacionService.marcarTodasComoLeidas(req.user.id_usuario));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/notificaciones/{id}:
 *   delete:
 *     summary: Eliminar una notificación
 *     description: Elimina (lógicamente) una notificación individual, cambiando su estado a ELIMINADA.
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la notificación (id_notificacion).
 *     responses:
 *       200:
 *         description: Notificación eliminada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notificacion'
 *       404:
 *         description: No existe una notificación con ese ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.delete('/:id', async (req, res) => {
    try {
        res.json(await notificacionService.eliminar(req.params.id, req.user.id_usuario));
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/notificaciones:
 *   delete:
 *     summary: Eliminar varias notificaciones
 *     tags: [Notificaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["NOT-1732550000000-4821", "NOT-1732550000111-9021"]
 *     responses:
 *       200:
 *         description: Notificaciones eliminadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notificacion'
 *       400:
 *         description: No se indicó ningún ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.delete('/', async (req, res) => {
    try {
        res.json(await notificacionService.eliminarVarias(req.body.ids, req.user.id_usuario));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
