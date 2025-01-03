// Archivo: server.js

require('dotenv').config();
const express = require('express');
const AmbienteTimer = require('./ambiente');
const setupApiRoutes = require('./api');
const setupWebRoutes = require('./web');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3000;

//host: process.env.DB_HOST || 'autorack.proxy.rlwy.net',
//password: process.env.DB_PASSWORD,
//database: process.env.DB_NAME || 'railway',
//port: process.env.DB_PORT || 36100,

const desarrollo =  process.env.NODE_ENV || false;

let host;
let DB;
let puerto;
if(desarrollo==="development"){
    host = process.env.DB_HOST;
    DB =  process.env.DB_NAME;
    puerto = process.env.DB_PORT;
} else {
    host = 'autorack.proxy.rlwy.net';
    DB = 'railway';
    puerto = 36100;
}


async function createPool() {
    const config = {
        //host: 'autorack.proxy.rlwy.net',
        host : host,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: DB,
        port: puerto,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        waitForConnections: true,
        connectTimeout: 10000,
        // Usar formato UTC en lugar de zona horaria específica
        timezone: '+00:00'
    };
    
    try {
        const pool = mysql.createPool(config);
        await pool.query('SELECT 1');
        console.log('\x1b[32m%s\x1b[0m', '✅ Conexión a base de datos establecida');
        return pool;
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Error de conexión:', error.message);
    
        // Crear un objeto seguro sin la contraseña
        const safeConfig = { ...config };
        delete safeConfig.password;
    
        // Mostrar las variables de configuración seguras
        console.log('\x1b[33m%s\x1b[0m', '🔍 Variables de configuración usadas (sin contraseña):');
        console.log(safeConfig);
    
        return null;
    }
}

async function startServer() {
    const ambienteTimer = new AmbienteTimer();
    let pool = null;

    try {
        pool = await createPool();
        if (pool) {
            await ambienteTimer.setMySQLConnection(pool);
            console.log('✅ Pool MySQL configurado en AmbienteTimer');
        }
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Error al configurar la conexión:', error.message);
    }

    // Middleware para parsear JSON
    app.use(express.json());

    // Configurar CORS si es necesario
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    // Montar las rutas web primero
    setupWebRoutes(app, pool);
    
    // Luego montar las rutas API
    app.use('/api', setupApiRoutes(ambienteTimer));

    // Manejador de errores
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: err.message 
        });
    });

    app.listen(port, () => {
        console.log(`\n=== Servidor iniciado ===`);
        console.log(`🚀 Puerto: ${port}`);
        console.log(`🌍 URL: http://localhost:${port}`);
        console.log(`⚙️ Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`======================\n`);
    });
}

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Promesa rechazada no manejada:', err);
});

startServer();