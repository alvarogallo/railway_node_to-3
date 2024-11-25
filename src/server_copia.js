require('dotenv').config();
const express = require('express');
const AmbienteTimer = require('./ambiente');
const setupApiRoutes = require('./api');
const setupWebRoutes = require('./web');
const { createPool } = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

async function startServer() {
    const ambienteTimer = new AmbienteTimer();
    let pool = null;

    try {
        pool = await createPool();
        ambienteTimer.setMySQLConnection(pool);
    } catch (error) {
        console.log('\x1b[33m%s\x1b[0m', 'No conexión base de datos');
    }

    // Montar las rutas web primero
    setupWebRoutes(app, pool);
    
    // Luego montar las rutas API
    app.use('/api', setupApiRoutes(ambienteTimer));

    app.listen(port, () => {
        console.log(`Servidor corriendo en http://localhost:${port}`);
        console.log(`Ambiente: ${process.env.NODE_ENV}`);
    });
}

startServer();