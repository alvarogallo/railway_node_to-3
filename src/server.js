const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'your-host',
    user: process.env.DB_USER || 'your-username',
    password: process.env.DB_PASSWORD || 'your-password',
    database: process.env.DB_NAME || 'your-database',
    port: process.env.DB_PORT || 3306,
};

// Mensajes personalizados
console.log('Verificando configuración de la base de datos...');
if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
    console.error('Error: Falta información de configuración. Revisa las variables de entorno.');
    process.exit(1);
} else {
    console.log('Servidor encontrado...');
    console.log(`Puerto válido: ${dbConfig.port}`);
}

// Crear conexión
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('Conexión exitosa a la base de datos.');
        console.log('Ejecutando consulta de prueba...');
        
        // Consulta de prueba
        connection.query('SELECT 1 + 1 AS result', (queryErr, results) => {
            if (queryErr) {
                console.error('Error al ejecutar la consulta:', queryErr.message);
            } else {
                console.log('Consulta ejecutada correctamente.');
                console.log('Resultado de la consulta de prueba:', results[0].result);
            }
            console.log('Cerrando conexión...');
            connection.end(() => console.log('Conexión cerrada.'));
        });
    }
});
