// Archivo: mysqlEnvChecker.js

require('dotenv').config();

// Variables requeridas para MySQL
const REQUIRED_MYSQL_VARS = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT'
];

function checkMySQLEnvironment() {
    console.log('\n=== Variables de Entorno MySQL ===\n');
    
    let missingVars = [];
    let configuredVars = [];

    REQUIRED_MYSQL_VARS.forEach(varName => {
        const value = process.env[varName];
        
        if (!value) {
            missingVars.push(varName);
        } else {
            // Ocultar la contraseña por seguridad
            const displayValue = varName === 'DB_PASSWORD' ? '********' : value;
            configuredVars.push({ name: varName, value: displayValue });
        }
    });

    // Mostrar variables configuradas
    if (configuredVars.length > 0) {
        console.log('Variables configuradas:');
        configuredVars.forEach(({name, value}) => {
            console.log(`${name}: ${value}`);
        });
    }

    // Mostrar variables faltantes
    if (missingVars.length > 0) {
        console.log('\n⚠️  Variables faltantes:');
        missingVars.forEach(varName => {
            console.log(`- ${varName}`);
        });
    }

    // Mostrar string de conexión de ejemplo
    if (configuredVars.length === REQUIRED_MYSQL_VARS.length) {
        const { DB_HOST, DB_USER, DB_NAME, DB_PORT } = process.env;
        console.log('\nString de conexión de ejemplo:');
        console.log(`mysql://${DB_USER}:****@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    }

    console.log('\n=== Fin del Reporte ===\n');

    // Retornar true si todas las variables están configuradas
    return missingVars.length === 0;
}

// Ejecutar la verificación
const isConfigComplete = checkMySQLEnvironment();

// Ejemplo de cómo usar el resultado
if (isConfigComplete) {
    console.log('✅ Todas las variables necesarias están configuradas');
} else {
    console.log('❌ Faltan algunas variables necesarias');
}

// Ejemplo de cómo se verían las variables en el archivo .env:
/*
DB_HOST=localhost
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=nombre_base_datos
DB_PORT=3306
*/