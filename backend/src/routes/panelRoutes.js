const express = require('express');
const router = express.Router();
const { manejarReprogramarEvento, manejarCancelarEvento } = require('../events/panelEventoHandler');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * /api/panel/reprogramar-evento:
 *   post:
 *     summary: Reprogramar un evento desde PANEL
 *     tags: [PANEL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_evento, nueva_fecha_evento]
 *             properties:
 *               id_evento: { type: string, example: "ev23" }
 *               nueva_fecha_evento: { type: string, format: date-time, example: "2026-11-21T01:00:00.000Z" }
 *               nombre_evento: { type: string, example: "Fiesta" }
 *     responses:
 *       200:
 *         description: Fecha actualizada, estado REPROGRAMADO y resumen de notificaciones.
 *       400:
 *         description: Datos inválidos, evento no encontrado o error de base de datos.
 */
router.post('/reprogramar-evento', async (req, res) => {
    try {
        res.json(await manejarReprogramarEvento(req.body));
    } catch (error) {
        res.status(400).json({ error: 'No se pudo reprogramar el evento', detalle: error.message });
    }
});

/**
 * @swagger
 * /api/panel/cancelar-evento:
 *   post:
 *     summary: Cancelar un evento desde PANEL
 *     tags: [PANEL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_evento]
 *             properties:
 *               id_evento: { type: string, example: "ev23" }
 *               nombre_evento: { type: string, example: "Fiesta" }
 *               motivo: { type: string, example: "Cambio de organización" }
 *     responses:
 *       200:
 *         description: Estado CANCELADO y resumen de notificaciones.
 *       400:
 *         description: Datos inválidos, evento no encontrado o error de base de datos.
 */
router.post('/cancelar-evento', async (req, res) => {
    try {
        res.json(await manejarCancelarEvento(req.body));
    } catch (error) {
        res.status(400).json({ error: 'No se pudo cancelar el evento', detalle: error.message });
    }
});

module.exports = router;
