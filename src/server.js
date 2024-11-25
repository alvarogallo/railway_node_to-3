// Archivo: envLogger.js

// Importamos dotenv para cargar variables de entorno desde .env en desarrollo local
require('dotenv').config();

// Función para mostrar todas las variables de entorno
function logEnvironmentVariables() {
    console.log('\n=== Variables de Entorno ===\n');
    
    // Obtener todas las variables de entorno
    const environmentVars = process.env;
    
    // Convertir el objeto de variables en un array para ordenarlo
    const sortedVars = Object.entries(environmentVars).sort();
    
    // Iterar sobre cada variable y mostrarla
    sortedVars.forEach(([key, value]) => {
        // Ocultar parte del valor si parece ser una clave secreta o token
        const isSecret = key.toLowerCase().includes('key') || 
                        key.toLowerCase().includes('secret') || 
                        key.toLowerCase().includes('token') ||
                        key.toLowerCase().includes('password');
        
        const displayValue = isSecret ? '********' : value;
        
        console.log(`${key}: ${displayValue}`);
    });
    
    console.log('\n=== Fin de Variables de Entorno ===\n');
}

// Ejecutar la función al iniciar el script
logEnvironmentVariables();

// Si quieres usar esto como parte de una aplicación Express:
/*
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Logging de variables al inicio
logEnvironmentVariables();

app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});
*/