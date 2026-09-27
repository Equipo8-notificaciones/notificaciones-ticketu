const express = require('express');
const { PORT } = require('./src/config/env');
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


if (require.main === module) {
    const { iniciarSuscripciones } = require('./src/broker/suscripciones');
    iniciarSuscripciones();

    app.listen(PORT, () => {
        console.log(`Servicio de Notificaciones corriendo en http://localhost:${PORT}`);
    });
}

module.exports = app;
