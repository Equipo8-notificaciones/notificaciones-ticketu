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
const panelRoutes = require('./src/routes/panelRoutes');
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/panel', panelRoutes);
app.use(errorHandler);

if (require.main === module) {
    const { iniciarSuscripciones } = require('./src/broker/suscripciones');
    app.listen(PORT, () => {
        console.log(`Servicio de Notificaciones corriendo en http://localhost:${PORT}`);
    });
    iniciarSuscripciones().catch(error => {
        console.error('[broker] No se pudieron iniciar las suscripciones:', error.message);
        console.error('[broker] El servidor HTTP sigue activo. Comprueba BROKER_MODE/BROKER_URL.');
    });
}

module.exports = app;
