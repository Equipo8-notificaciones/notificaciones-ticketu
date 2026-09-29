const express = require('express');
const { PORT } = require('./src/config/env');
const { testConnection } = require('./src/config/database');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const notificacionRoutes = require('./src/routes/notificacionRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ servicio: 'notificaciones', estado: 'OK' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/notificaciones', notificacionRoutes);

app.use(errorHandler);


async function iniciarServidor() {
    const { iniciarSuscripciones } = require('./src/broker/suscripciones');

    try {
        const conexion = await testConnection();
        console.log(`[database] Conectado a Supabase/PostgreSQL. Hora BD: ${conexion.fecha}`);
    } catch (error) {
        console.error('[database] No se pudo conectar a Supabase/PostgreSQL.');
        console.error(`[database] ${error.message}`);
        process.exitCode = 1;
        return;
    }

    iniciarSuscripciones();

    app.listen(PORT, () => {
        console.log(`Servicio de Notificaciones corriendo en http://localhost:${PORT}`);
    });
}

if (require.main === module) {
    iniciarServidor();
}

module.exports = app;
