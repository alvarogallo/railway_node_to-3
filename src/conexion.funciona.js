// Archivo: server.js

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    // Primera configuración usando DB_ variables
    const config1 = {
        host: 'mysql.railway.internal', // Host interno de Railway
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    };

    // Segunda configuración usando MYSQL_ variables
    const config2 = {
        host: 'mysql.railway.internal', // Host interno de Railway
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT
    };

    // Tercera configuración usando el host público
    const config3 = {
        host: 'autorack.proxy.rlwy.net',
        user: process.env.DB_USER || process.env.MYSQLUSER,
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
        database: process.env.DB_NAME || process.env.MYSQLDATABASE,
        port: 36100 // Puerto público específico
    };

    console.log('\n=== Intentando diferentes configuraciones de conexión ===\n');

    async function tryConnection(config, name) {
        console.log(`\nProbando configuración ${name}:`);
        console.log('Host:', config.host);
        console.log('Usuario:', config.user);
        console.log('Base de datos:', config.database);
        console.log('Puerto:', config.port);

        try {
            const connection = await mysql.createConnection(config);
            console.log('✅ ¡Conexión exitosa!');
            
            // Probar una consulta
            const [result] = await connection.query('SELECT 1 + 1 AS suma');
            console.log('Prueba de consulta:', result[0].suma);
            
            await connection.end();
            return true;
        } catch (error) {
            console.error('❌ Error:', error.message);
            return false;
        }
    }

    // Intentar todas las configuraciones
    console.log('Intentando conectar usando diferentes configuraciones...\n');

    try {
        // Intentar con config1 (DB_ variables)
        await tryConnection(config1, '1 (DB_ variables)');

        // Intentar con config2 (MYSQL_ variables)
        await tryConnection(config2, '2 (MYSQL_ variables)');

        // Intentar con config3 (host público)
        await tryConnection(config3, '3 (host público)');

    } catch (error) {
        console.error('\nError general:', error.message);
    }

    console.log('\nSugerencias:');
    console.log('1. Dentro de Railway, usa "mysql.railway.internal" como host');
    console.log('2. Para conexiones externas, usa "autorack.proxy.rlwy.net"');
    console.log('3. Verifica que las credenciales estén correctamente establecidas en las variables de entorno');
    console.log('4. El puerto interno debe ser 3306');
    console.log('5. El puerto público debe ser 36100');
}

// Ejecutar el test
testConnection();