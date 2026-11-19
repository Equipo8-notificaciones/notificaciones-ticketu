const fs = require('node:fs');
const path = require('node:path');
const envPath = process.env.DOTENV_CONFIG_PATH || path.join(
    __dirname,
    fs.existsSync(path.join(__dirname, '.env')) ? '.env' : '.env'
);
require('dotenv').config({ path: envPath });

const express = require('express');
const { PORT } = require('./src/config/env');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const notificacionRoutes = require('./src/routes/notificacionRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || false,
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
    res.json({ servicio: 'notificaciones', estado: 'OK' });
});

app.get('/ready', async (req, res) => {
    try {
        await require('./src/config/database').getPool().query('SELECT 1');
        res.json({ servicio: 'notificaciones', estado: 'READY', base_datos: 'conectada' });
    } catch (error) {
        res.status(503).json({
            servicio: 'notificaciones',
            estado: 'NOT_READY',
            base_datos: 'no_disponible',
            error: error.message
        });
    }
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/notificaciones', notificacionRoutes);
app.use(errorHandler);

if (require.main === module) {
    const { supervisarSuscripciones } = require('./src/broker/suscripciones');
    app.listen(PORT, () => {
        console.log(`Servicio de Notificaciones corriendo en http://localhost:${PORT}`);
    });
    supervisarSuscripciones().catch(error => {
        console.error('[broker] Error no recuperable en el supervisor de suscripciones:', error.message);
    });
}

module.exports = app;
