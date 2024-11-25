// Archivo: testMySQLConnection.js

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('\n=== Probando Conexión a MySQL ===\n');

    // Configuración de la conexión
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    };

    console.log('Intentando conectar con la siguiente configuración:');
    console.log(`Host: ${config.host}`);
    console.log(`Usuario: ${config.user}`);
    console.log(`Base de datos: ${config.database}`);
    console.log(`Puerto: ${config.port}`);
    console.log('Contraseña: ********\n');

    try {
        // Intentar establecer la conexión
        console.log('Estableciendo conexión...');
        const connection = await mysql.createConnection(config);
        
        // Probar la conexión con una consulta simple
        console.log('Conexión exitosa! Probando consulta...');
        const [result] = await connection.query('SELECT 1 + 1 AS test');
        
        console.log('Consulta de prueba exitosa!');
        console.log('Resultado:', result[0].test);

        // Obtener información del servidor
        const [version] = await connection.query('SELECT VERSION() as version');
        console.log('\nInformación del servidor MySQL:');
        console.log('Versión:', version[0].version);

        // Mostrar las bases de datos disponibles
        const [databases] = await connection.query('SHOW DATABASES');
        console.log('\nBases de datos disponibles:');
        databases.forEach(db => {
            console.log(`- ${db.Database}`);
        });

        // Cerrar la conexión
        await connection.end();
        console.log('\nConexión cerrada correctamente');
        
    } catch (error) {
        console.error('\n❌ Error al conectar:', error.message);
        
        // Sugerencias basadas en errores comunes
        if (error.code === 'ECONNREFUSED') {
            console.log('\nSugerencias:');
            console.log('1. Verifica que el host y puerto sean correctos');
            console.log('2. Asegúrate que el servidor MySQL esté corriendo');
            console.log('3. Revisa si hay algún firewall bloqueando la conexión');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\nSugerencias:');
            console.log('1. Verifica que el usuario y contraseña sean correctos');
            console.log('2. Confirma que el usuario tenga permisos para conectarse desde tu IP');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\nSugerencias:');
            console.log('1. Verifica que el nombre de la base de datos sea correcto');
            console.log('2. Asegúrate que la base de datos exista');
        }
    }

    console.log('\n=== Fin de la Prueba ===\n');
}

// Ejecutar la prueba
testConnection();