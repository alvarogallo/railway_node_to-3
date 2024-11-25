// Archivo: server.js

require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de la conexión
const config = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'containers-us-west-37.railway.app', // Ejemplo de host de Railway
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
};

async function testConnection() {
    console.log('\n=== Configuración actual ===');
    console.log('Host:', config.host);
    console.log('Usuario:', config.user);
    console.log('Base de datos:', config.database);
    console.log('Puerto:', config.port);
    console.log('=========================\n');

    try {
        console.log('Intentando conectar a MySQL...');
        const connection = await mysql.createConnection(config);
        
        console.log('¡Conexión exitosa!');
        
        // Probar una consulta simple
        const [result] = await connection.query('SELECT 1 + 1 AS suma');
        console.log('Prueba de consulta:', result[0].suma);

        // Mostrar bases de datos disponibles
        const [databases] = await connection.query('SHOW DATABASES');
        console.log('\nBases de datos disponibles:');
        databases.forEach(db => {
            console.log(`- ${db.Database}`);
        });

        await connection.end();
        console.log('\nConexión cerrada correctamente');

    } catch (error) {
        console.error('\n❌ Error de conexión:', error.message);
        console.log('\nPosibles soluciones:');
        console.log('1. Verifica el host en Railway:', 'https://railway.app/project/[tu-proyecto]/variables');
        console.log('2. El host debería ser algo como: containers-us-west-XX.railway.app');
        console.log('3. Asegúrate de usar el puerto correcto (normalmente diferente a 3306 en Railway)');
        console.log('4. Verifica que las credenciales sean correctas');
    }
}

// Ejecutar el test
testConnection();